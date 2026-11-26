import * as THREE from "three";

/**
 * The texture shown inside the pupil: a built-in animated demo (canvas),
 * an image, or a video. `texture` and `aspect` are read by the eye material.
 */
export class PupilMedia {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = 512;
    this.ctx = this.canvas.getContext("2d");
    this.demo = new THREE.CanvasTexture(this.canvas);
    this.demo.colorSpace = THREE.SRGBColorSpace;
    this.texture = this.demo;
    this.aspect = 1;
    this.kind = "demo";
    this.video = null;
    this.owned = null; // texture we created and must dispose
    this.time = 0;
    this.loadId = 0;
    this.#drawDemo();
  }

  async set(source) {
    const id = ++this.loadId;
    try {
      if (source.kind === "video") {
        const video = document.createElement("video");
        Object.assign(video, { src: source.url, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
        await new Promise((ok, fail) => {
          video.onloadedmetadata = ok;
          video.onerror = () => fail(new Error("vidéo illisible"));
        });
        if (id !== this.loadId) return;
        const tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        this.#swap(tex, video.videoWidth / video.videoHeight, "video", video);
      } else if (source.kind === "image") {
        const tex = await new THREE.TextureLoader().loadAsync(source.url);
        if (id !== this.loadId) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.#swap(tex, tex.image.width / tex.image.height, "image", null);
      } else {
        this.#swap(this.demo, 1, "demo", null);
      }
    } catch (err) {
      console.warn("[pupille] média non chargé, retour à la démo:", err);
      if (id === this.loadId) this.#swap(this.demo, 1, "demo", null);
    }
  }

  /** Call every frame; `active` = currently visible (plays/pauses video, animates demo). */
  update(dt, active) {
    this.time += dt;
    if (this.video) {
      if (active && this.video.paused) this.video.play().catch(() => {});
      if (!active && !this.video.paused) this.video.pause();
    }
    if (active && this.kind === "demo") {
      this.#drawDemo();
      this.demo.needsUpdate = true;
    }
  }

  dispose() {
    this.video?.pause();
    this.owned?.dispose();
    this.demo.dispose();
  }

  #swap(tex, aspect, kind, video) {
    this.video?.pause();
    if (this.owned && this.owned !== tex) this.owned.dispose();
    this.owned = tex === this.demo ? null : tex;
    this.texture = tex;
    this.aspect = aspect || 1;
    this.kind = kind;
    this.video = video;
  }

  // Cyberpunk "scope" test pattern, so F works before any media is chosen.
  #drawDemo() {
    const c = this.ctx;
    const s = 512;
    const t = this.time;
    c.fillStyle = "#0e0e17";
    c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(94,246,255,0.35)";
    c.lineWidth = 2;
    for (let r = 40; r < 256; r += 48) {
      c.beginPath();
      c.arc(256, 256, r, 0, Math.PI * 2);
      c.stroke();
    }
    // Sweep
    const a = t * 2;
    const g = c.createConicGradient(a, 256, 256);
    g.addColorStop(0, "rgba(247,80,73,0.9)");
    g.addColorStop(0.12, "rgba(247,80,73,0)");
    g.addColorStop(1, "rgba(247,80,73,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(256, 256, 250, 0, Math.PI * 2);
    c.fill();
    // Blips
    c.fillStyle = "#1ded83";
    for (let i = 0; i < 5; i++) {
      const ba = i * 1.3 + 0.4;
      const br = 70 + ((i * 53) % 160);
      const fade = (((a - ba) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      c.globalAlpha = Math.max(0, 1 - fade / 3);
      c.fillRect(256 + Math.cos(ba) * br - 5, 256 + Math.sin(ba) * br - 5, 10, 10);
    }
    c.globalAlpha = 1;
    c.fillStyle = "#5ef6ff";
    c.font = "bold 64px Orbitron, sans-serif";
    c.textAlign = "center";
    c.fillText("OEIL", 256, 240);
    c.font = "28px monospace";
    c.fillStyle = "#fb932e";
    c.fillText(new Date().toTimeString().slice(0, 8), 256, 290);
  }
}
