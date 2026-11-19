"""
Wave detection for the person the eye is following.

No extra model: frame differencing in two zones beside / just above the
followed face, where a raised waving hand goes. A wave is motion there that
swings back and forth: the horizontal centre of the moving pixels must reverse
direction at least `reversals` times within `window` seconds. Motion of the
face itself (walking, turning) suppresses it, so body sway isn't a wave.

    det = WaveDetector()
    level, waving = det.update(frame_bgr, face_xywh_or_None, t_seconds)
"""
from collections import deque

import cv2
import numpy as np

WORK_W = 320  # analysis width (pixels), for speed


class WaveDetector:
    def __init__(
        self,
        threshold=22,  # per-pixel brightness change that counts as motion
        min_energy=0.015,  # fraction of a zone's pixels that must move
        swing=0.25,  # min back-and-forth amplitude, in face widths
        reversals=2,  # direction changes needed within `window`
        window=1.5,  # seconds
        hold=0.4,  # keep "waving" this long after the last reversal window ends
        max_face_motion=0.25,  # fraction of the face box moving -> body is moving, ignore
    ):
        self.threshold = threshold
        self.min_energy = min_energy
        self.swing = swing
        self.need = reversals
        self.window = window
        self.hold = hold
        self.max_face_motion = max_face_motion
        self.prev = None
        self.prev_face = None
        self.zones = {}  # side -> {"dir", "ext", "times": deque}
        self.last_wave = -1e9
        self.level = 0.0
        self.last_t = None
        self.debug = {"zones": [], "energy": 0.0}

    def reset(self):
        self.zones.clear()

    def update(self, frame, face, t):
        """frame: BGR image; face: (x, y, w, h) in frame pixels or None; t: seconds."""
        dt = 0.033 if self.last_t is None else max(1e-3, t - self.last_t)
        self.last_t = t
        scale = WORK_W / frame.shape[1]
        small = cv2.resize(frame, (WORK_W, int(frame.shape[0] * scale)), interpolation=cv2.INTER_AREA)
        gray = cv2.GaussianBlur(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), (5, 5), 0)
        prev, self.prev = self.prev, gray
        self.debug = {"zones": [], "energy": 0.0}

        if prev is None or face is None:
            self.reset()
            self.prev_face = None
            return self._out(t, dt)

        H, W = gray.shape
        x, y, w, h = (v * scale for v in face)
        moving = cv2.absdiff(gray, prev) > self.threshold

        # Body/head moving -> not a wave.
        fx0, fy0, fx1, fy1 = int(max(x, 0)), int(max(y, 0)), int(min(x + w, W)), int(min(y + h, H))
        face_motion = moving[fy0:fy1, fx0:fx1].mean() if fx1 > fx0 and fy1 > fy0 else 0.0
        face_shift = 0.0
        if self.prev_face is not None:
            px, py, pw, _ = self.prev_face
            face_shift = np.hypot((x + w / 2) - (px + pw / 2), (y + h / 2) - (py + h / 2)) / max(w, 1)
        self.prev_face = (x, y, w, h)
        body_moving = face_motion > self.max_face_motion or face_shift > 0.12

        # Zones: beside the head and up to a bit above it, down to the shoulders.
        y0, y1 = int(max(y - 1.6 * h, 0)), int(min(y + 1.6 * h, H))
        sides = {
            "left": (int(max(x - 3.2 * w, 0)), int(max(x - 0.35 * w, 0))),
            "right": (int(min(x + 1.35 * w, W)), int(min(x + 4.2 * w, W))),
        }
        cx_face = x + w / 2
        for side, (x0, x1) in sides.items():
            z = self.zones.setdefault(side, {"dir": 0, "ext": None, "times": deque()})
            self.debug["zones"].append((x0 / scale, y0 / scale, x1 / scale, y1 / scale))
            if x1 - x0 < 4 or y1 - y0 < 4:
                continue
            sub = moving[y0:y1, x0:x1]
            energy = sub.mean()
            self.debug["energy"] = max(self.debug["energy"], float(energy))
            if body_moving or energy < self.min_energy:
                continue
            xs = np.nonzero(sub)[1]
            pos = (xs.mean() + x0 - cx_face) / w  # in face widths from the face centre
            self._track(z, pos, t)

        for z in self.zones.values():
            while z["times"] and t - z["times"][0] > self.window:
                z["times"].popleft()
            if len(z["times"]) >= self.need:
                self.last_wave = t
        return self._out(t, dt)

    def _track(self, z, pos, t):
        """Count direction reversals of `pos` with hysteresis `swing`."""
        if z["ext"] is None:
            z["ext"] = pos
            return
        if z["dir"] >= 0 and pos < z["ext"] - self.swing:
            if z["dir"] == 1:
                z["times"].append(t)
            z["dir"], z["ext"] = -1, pos
        elif z["dir"] <= 0 and pos > z["ext"] + self.swing:
            if z["dir"] == -1:
                z["times"].append(t)
            z["dir"], z["ext"] = 1, pos
        elif (z["dir"] == 1 and pos > z["ext"]) or (z["dir"] == -1 and pos < z["ext"]):
            z["ext"] = pos

    def _out(self, t, dt):
        waving = t - self.last_wave <= self.hold
        goal = 1.0 if waving else 0.0
        rate = 12.0 if goal > self.level else 4.0
        self.level += (goal - self.level) * (1 - np.exp(-rate * dt))
        return self.level, waving


# ------------------------------------------------------------- self-test
if __name__ == "__main__":
    # Synthetic scenes: a still "face", plus a "hand" that waves, stays, or a
    # body that walks across. Prints whether a wave is detected.
    rng = np.random.default_rng(0)

    def scene(kind, seconds=3.0, fps=20):
        det = WaveDetector()
        face = [300.0, 140.0, 60.0, 70.0]
        hits, frames = [], int(seconds * fps)
        for i in range(frames):
            t = i / fps
            img = np.full((480, 640, 3), 90, np.uint8)
            img += rng.integers(0, 6, img.shape, dtype=np.uint8)  # sensor noise
            fx = face[0]
            if kind == "walk":
                fx = 120 + 160 * t  # whole person moves across
            cv2.rectangle(img, (int(fx), 140), (int(fx + 60), 210), (170, 150, 140), -1)  # face
            cv2.rectangle(img, (int(fx - 20), 210), (int(fx + 80), 470), (60, 60, 70), -1)  # torso
            if kind == "wave":
                hx = fx + 130 + 45 * np.sin(2 * np.pi * 2.0 * t)  # 2 Hz, +-0.75 face widths
                cv2.rectangle(img, (int(hx), 90), (int(hx + 40), 160), (180, 160, 150), -1)
            elif kind == "slow":  # lazy 1 Hz wave
                hx = fx + 130 + 40 * np.sin(2 * np.pi * 1.0 * t)
                cv2.rectangle(img, (int(hx), 90), (int(hx + 40), 160), (180, 160, 150), -1)
            elif kind == "reach":  # hand sweeps once, outward, beside the head
                hx = fx + 100 + 60 * t
                cv2.rectangle(img, (int(hx), 90), (int(hx + 40), 160), (180, 160, 150), -1)
            elif kind == "raise":  # hand up but still
                cv2.rectangle(img, (int(fx + 130), 90), (int(fx + 170), 160), (180, 160, 150), -1)
            elif kind == "walk":
                cv2.rectangle(img, (int(fx + 90), 200), (int(fx + 120), 300), (180, 160, 150), -1)
            level, waving = det.update(img, (fx, 140, 60, 70), t)
            hits.append(waving)
        first = next((i / fps for i, v in enumerate(hits) if v), None)
        return sum(hits) / len(hits), first

    for kind in ("wave", "slow", "still", "raise", "reach", "walk"):
        ratio, first = scene(kind)
        print(f"{kind:6s} waving {ratio * 100:5.1f}% of frames, first at {first if first is None else round(first, 2)} s")
