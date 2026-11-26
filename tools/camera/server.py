"""
Camera tracker for the eye.

OpenCV finds the people (faces) in front of the camera, picks one, and streams
where the eye should look over WebSocket, in the same JSON the display already
accepts from the ESP32 bridge. Nobody there -> it sends the center.

    tools/camera/.venv/bin/python tools/camera/server.py            # auto-picks the USB camera
    tools/camera/.venv/bin/python tools/camera/server.py --list     # list cameras

Endpoints (default port 8787):
    ws://HOST:8787/            gaze stream, ~30 Hz:
                               {"x": -1..1, "y": -1..1, "present": bool, "count": n, "size": 0..1,
                                "wave": bool}   wave = the followed person is waving
    http://HOST:8787/          status page with the annotated live preview
    http://HOST:8787/stream.mjpg   annotated preview (MJPEG), used by the dashboard
    http://HOST:8787/status.json

Privacy: frames are processed in memory and never written to disk. The preview
is only served on localhost unless you pass --host 0.0.0.0.
"""
import argparse
import asyncio
import glob
import json
import os
import threading
import time

import cv2
import numpy as np
from aiohttp import WSMsgType, web

from wave_detect import WaveDetector

HERE = os.path.dirname(os.path.abspath(__file__))
YUNET = os.path.join(HERE, "models", "face_detection_yunet_2023mar.onnx")


# ------------------------------------------------------------------ cameras
def list_cameras():
    cams = []
    for dev in sorted(glob.glob("/sys/class/video4linux/video*")):
        try:
            name = open(os.path.join(dev, "name")).read().strip()
            index = int(open(os.path.join(dev, "index")).read().strip())
        except OSError:
            continue
        if index == 0:  # index 1+ are metadata nodes of the same camera
            cams.append(("/dev/" + os.path.basename(dev), name))
    return cams


def pick_camera(arg):
    if arg != "auto":
        return int(arg) if arg.isdigit() else arg
    cams = list_cameras()
    external = [c for c in cams if "integrated" not in c[1].lower()]
    return (external or cams or [(0, "default")])[0][0]


# ------------------------------------------------------------------ detector
class FaceDetector:
    """YuNet (OpenCV DNN) if the model is present, else the bundled Haar cascade."""

    def __init__(self, min_score):
        self.yunet = None
        if os.path.exists(YUNET):
            self.yunet = cv2.FaceDetectorYN.create(YUNET, "", (320, 240), min_score, 0.3, 50)
            self.name = "YuNet"
        else:
            path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
            self.haar = cv2.CascadeClassifier(path)
            self.name = "Haar (YuNet model missing)"

    def detect(self, frame):
        """List of (x, y, w, h, score) in pixels."""
        h, w = frame.shape[:2]
        if self.yunet is not None:
            self.yunet.setInputSize((w, h))
            _, faces = self.yunet.detect(frame)
            if faces is None:
                return []
            return [(f[0], f[1], f[2], f[3], float(f[14])) for f in faces]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        found = self.haar.detectMultiScale(gray, 1.15, 5, minSize=(40, 40))
        return [(x, y, fw, fh, 1.0) for (x, y, fw, fh) in found]


# ------------------------------------------------------------------ tracker
class Tracker:
    """Capture + detection in a thread; `state` and `jpeg` are read by the server."""

    def __init__(self, args):
        self.args = args
        self.lock = threading.Lock()
        self.state = {"x": 0.0, "y": 0.0, "present": False, "count": 0, "size": 0.0, "wave": False}
        self.jpeg = None
        self.want_preview = 0  # number of preview viewers
        self.fps = 0.0
        self.running = True
        self.camera = pick_camera(args.camera)
        self.detector = FaceDetector(args.min_score)
        self.target = None  # (cx, cy, w) in 0..1 of the followed face
        self.last_seen = 0.0
        self.smooth = np.array([0.0, 0.0])
        self.wave = WaveDetector() if args.wave else None

    def start(self):
        threading.Thread(target=self.run, daemon=True).start()

    def open(self):
        cap = cv2.VideoCapture(self.camera, cv2.CAP_V4L2) if isinstance(self.camera, str) else cv2.VideoCapture(self.camera)
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.args.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.args.height)
        return cap

    def choose(self, faces, w, h):
        """Follow the same person while they stay; switch only to someone clearly
        closer (bigger face). Returns (cx, cy, size, face_xywh) — 0..1 except
        the face box in pixels — or None."""
        if not faces:
            return None
        best, best_score = None, -1.0
        for x, y, fw, fh, _ in faces:
            cx, cy, size = (x + fw / 2) / w, (y + fh / 2) / h, fw / w
            score = size
            if self.target is not None:
                dist = np.hypot(cx - self.target[0], cy - self.target[1])
                if dist < max(self.target[2], size) * 1.2:
                    score *= self.args.stickiness  # same person as before
            if score > best_score:
                best, best_score = (cx, cy, size, (x, y, fw, fh)), score
        return best

    def to_gaze(self, cx, cy):
        x = (cx * 2 - 1) * (-1 if self.args.mirror else 1)
        y = (1 - cy * 2) + self.args.offset_y
        return np.clip([x * self.args.gain_x, y * self.args.gain_y], -1, 1)

    def run(self):
        cap = self.open()
        if cap.isOpened():
            print(f"[camera] {self.camera} opened, detector: {self.detector.name}")
        frames, t0, warned = 0, time.time(), False
        while self.running:
            ok, frame = cap.read() if cap.isOpened() else (False, None)
            if not ok:
                if not warned:
                    print(f"[camera] can't read {self.camera}: missing, or in use by another program "
                          "(another camera server? a video call?). Retrying every 2 s; --list shows cameras.")
                    warned = True
                cap.release()
                time.sleep(2)
                cap = self.open()
                continue
            if warned:
                print(f"[camera] {self.camera} is back")
                warned = False
            h, w = frame.shape[:2]
            faces = self.detector.detect(frame)
            now = time.time()
            pick = self.choose(faces, w, h)
            if pick is not None:
                self.target, self.last_seen = pick[:3], now
            # Waving: only around the person being followed.
            waving = False
            if self.wave is not None:
                _, waving = self.wave.update(frame, pick[3] if pick else None, now)
            elif self.target is not None and now - self.last_seen > self.args.hold:
                self.target = None  # gone: recenter

            goal = self.to_gaze(*self.target[:2]) if self.target else np.array([0.0, 0.0])
            a = 1 - np.exp(-self.args.smoothing * (1 / 30))
            self.smooth += (goal - self.smooth) * a

            with self.lock:
                self.state = {
                    "x": round(float(self.smooth[0]), 4),
                    "y": round(float(self.smooth[1]), 4),
                    "present": self.target is not None,
                    "count": len(faces),
                    "size": round(float(self.target[2]), 3) if self.target else 0.0,
                    "wave": bool(waving),
                }
            if self.want_preview > 0:
                self.annotate(frame, faces, pick)
                ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if ok:
                    with self.lock:
                        self.jpeg = buf.tobytes()
            frames += 1
            if now - t0 >= 1:
                self.fps, frames, t0 = frames / (now - t0), 0, now
        cap.release()

    def annotate(self, frame, faces, pick):
        h, w = frame.shape[:2]
        for x, y, fw, fh, score in faces:
            cv2.rectangle(frame, (int(x), int(y)), (int(x + fw), int(y + fh)), (255, 246, 94), 1)
        if self.wave is not None:
            col = (131, 237, 29) if self.state.get("wave") else (120, 120, 120)
            for x0, y0, x1, y1 in self.wave.debug["zones"]:
                cv2.rectangle(frame, (int(x0), int(y0)), (int(x1), int(y1)), col, 1)
        if pick is not None:
            cx, cy, size, _ = pick
            r = int(size * w * 0.6)
            cv2.circle(frame, (int(cx * w), int(cy * h)), r, (73, 80, 247), 2)
            cv2.drawMarker(frame, (int(cx * w), int(cy * h)), (73, 80, 247), cv2.MARKER_CROSS, 18, 2)
        s = self.state
        label = f"{len(faces)} face(s)  gaze {s['x']:+.2f} {s['y']:+.2f}  {self.fps:.0f} fps"
        if s.get("wave"):
            label += "  WAVE"
        cv2.rectangle(frame, (0, 0), (w, 22), (23, 14, 14), -1)
        cv2.putText(frame, label, (8, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 246, 94), 1, cv2.LINE_AA)


# ------------------------------------------------------------------ server
STATUS_PAGE = """<!doctype html><html lang="fr"><meta charset="utf-8">
<title>OEIL // camera</title>
<style>body{margin:0;background:#0e0e17;color:#5ef6ff;font:14px monospace;display:grid;place-items:center;min-height:100vh}
main{border:2px solid #f75049;padding:16px;max-width:680px;width:calc(100% - 32px)}h1{color:#f75049;font-size:16px;letter-spacing:.2em}
img{width:100%;display:block;border:1px solid #f7504966}pre{white-space:pre-wrap}</style>
<main><h1>OEIL // CAMERA TRACKER</h1><img src="/stream.mjpg" alt="preview"><pre id="s"></pre></main>
<script>setInterval(async()=>{document.getElementById('s').textContent=JSON.stringify(await (await fetch('/status.json')).json(),null,1)},500)</script>
</html>"""


def make_app(tracker, rate):
    clients = set()

    async def index(request):
        if request.headers.get("Upgrade", "").lower() == "websocket":
            ws = web.WebSocketResponse(heartbeat=10)
            await ws.prepare(request)
            clients.add(ws)
            try:
                async for msg in ws:  # nothing to read; keep the socket open
                    if msg.type == WSMsgType.ERROR:
                        break
            finally:
                clients.discard(ws)
            return ws
        return web.Response(text=STATUS_PAGE, content_type="text/html")

    async def status(_request):
        with tracker.lock:
            body = {**tracker.state, "fps": round(tracker.fps, 1), "camera": str(tracker.camera),
                    "detector": tracker.detector.name, "clients": len(clients)}
        return web.json_response(body, headers={"Access-Control-Allow-Origin": "*"})

    async def stream(request):
        resp = web.StreamResponse(headers={
            "Content-Type": "multipart/x-mixed-replace; boundary=frame",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        })
        await resp.prepare(request)
        tracker.want_preview += 1
        try:
            while True:
                with tracker.lock:
                    jpg = tracker.jpeg
                if jpg:
                    await resp.write(b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg + b"\r\n")
                await asyncio.sleep(1 / 15)
        except (ConnectionResetError, asyncio.CancelledError):
            pass
        finally:
            tracker.want_preview -= 1
        return resp

    async def broadcast(_app):
        async def loop():
            while True:
                with tracker.lock:
                    msg = json.dumps(tracker.state)
                for ws in list(clients):
                    try:
                        await ws.send_str(msg)
                    except ConnectionResetError:
                        clients.discard(ws)
                await asyncio.sleep(1 / rate)
        task = asyncio.create_task(loop())
        yield
        task.cancel()

    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_get("/status.json", status)
    app.router.add_get("/stream.mjpg", stream)
    app.cleanup_ctx.append(broadcast)
    return app


def main():
    p = argparse.ArgumentParser(description="Camera tracker for the eye (OpenCV -> WebSocket).")
    p.add_argument("--camera", default="auto", help="'auto' (first USB camera), an index, or /dev/videoN")
    p.add_argument("--list", action="store_true", help="list cameras and exit")
    p.add_argument("--host", default="127.0.0.1", help="0.0.0.0 to serve the LAN (exposes the preview!)")
    p.add_argument("--port", type=int, default=8787)
    p.add_argument("--width", type=int, default=640)
    p.add_argument("--height", type=int, default=480)
    p.add_argument("--rate", type=float, default=30, help="gaze messages per second")
    p.add_argument("--min-score", type=float, default=0.75, help="face detection confidence")
    p.add_argument("--hold", type=float, default=1.0, help="seconds to keep looking after someone disappears")
    p.add_argument("--smoothing", type=float, default=10, help="1/s, higher = snappier")
    p.add_argument("--stickiness", type=float, default=1.6, help="bonus for the person already followed")
    p.add_argument("--gain-x", type=float, default=1.0)
    p.add_argument("--gain-y", type=float, default=1.0)
    p.add_argument("--offset-y", type=float, default=0.0, help="shift the gaze up (+) or down (-)")
    p.add_argument("--no-wave", dest="wave", action="store_false", help="disable wave detection")
    p.add_argument("--no-mirror", dest="mirror", action="store_false",
                   help="by default the image is mirrored: the camera faces the audience like the eye does")
    args = p.parse_args()

    if args.list:
        for dev, name in list_cameras():
            print(f"{dev}\t{name}")
        return

    tracker = Tracker(args)
    try:
        asyncio.run(serve(args, tracker))
    except KeyboardInterrupt:
        pass
    finally:
        tracker.running = False


async def serve(args, tracker):
    # Bind the port BEFORE touching the camera: if another server already runs,
    # exit cleanly instead of fighting it for the camera.
    runner = web.AppRunner(make_app(tracker, args.rate))
    await runner.setup()
    try:
        await web.TCPSite(runner, args.host, args.port).start()
    except OSError as err:
        await runner.cleanup()
        raise SystemExit(
            f"[camera] port {args.port} is already in use ({err.strerror}). Another camera server is "
            f"probably running: stop it (ss -ltnp | grep {args.port}) or use --port."
        )
    tracker.start()
    print(f"[camera] ws://{args.host}:{args.port}/   preview http://{args.host}:{args.port}/   (Ctrl+C to stop)")
    try:
        await asyncio.Event().wait()
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    main()
