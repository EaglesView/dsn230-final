"""
Texture maps for the realistic eye, derived from the photo texture (eyeball.jpg).

Pure numpy so it runs both inside Blender (rig_pupil.py) and from a plain
Python shell for quick previews (python3 tools/blender/eye_textures.py in.jpg out_dir).

Arrays are float32, shape (H, W, 3) in 0..1, row 0 = TOP of the image.
Geometry is given in pixels: pupil center (cx, cy), pupil and iris radii.

Maps:
  clean      base color with the reflections painted into the photo removed
             (the 3D cornea now makes real ones)
  normal     tangent-space normal map from the photo's fine luminance detail
             (iris fibers, crypts, veins)
  roughness  sclera wet, iris matte, pupil in between
  coat       clearcoat weight (tear film): sclera only — the iris sits under
             the cornea, which carries its own reflection
"""
import numpy as np


# ---------------------------------------------------------------- utilities
def box_blur(a, r):
    """Box blur of radius r along both axes (2D array). Edge-clamped."""
    if r < 1:
        return a
    k = 2 * r + 1
    c = np.cumsum(np.pad(a, ((0, 0), (r + 1, r)), mode="edge"), axis=1)
    a = (c[:, k:] - c[:, :-k]) / k
    c = np.cumsum(np.pad(a, ((r + 1, r), (0, 0)), mode="edge"), axis=0)
    return (c[k:, :] - c[:-k, :]) / k


def blur(a, sigma):
    """Approximate Gaussian blur (three box passes) of a 2D array."""
    r = max(1, int(round(sigma * 0.9)))
    for _ in range(3):
        a = box_blur(a, r)
    return a


def blur_rgb(img, sigma):
    return np.stack([blur(img[..., c], sigma) for c in range(3)], axis=-1)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def luminance(img):
    return img[..., 0] * 0.2126 + img[..., 1] * 0.7152 + img[..., 2] * 0.0722


def dilate(mask, r):
    return box_blur(mask.astype(np.float32), r) > 1e-3


def inpaint(img, mask, box):
    """Fill `mask` by multi-scale diffusion from its surroundings, inside `box`
    (y0, y1, x0, x1) only, to keep it fast."""
    y0, y1, x0, x1 = box
    sub = img[y0:y1, x0:x1].copy()
    m = mask[y0:y1, x0:x1]
    if not m.any():
        return img
    known = ~m
    # Seed holes with the average of the known pixels around them.
    sub[m] = sub[known & dilate(m, 12)].mean(axis=0)
    for r in (24, 12, 6, 3, 1):
        for _ in range(12):
            b = np.stack([box_blur(sub[..., c], r) for c in range(3)], axis=-1)
            sub[m] = b[m]
    out = img.copy()
    out[y0:y1, x0:x1] = sub
    return out


def radial_fill(img, mask, box, cx, cy, angle_deg=50.0):
    """Fill an iris hole with believable fibers: smooth color from diffusion,
    plus high-frequency detail copied from the same radius, rotated by
    `angle_deg` around the pupil (iris fibers are radial, so they line up).
    The result is feathered into the original."""
    low = inpaint(img, mask, box)
    hf = img - blur_rgb(img, 5)
    ys, xs = np.nonzero(dilate(mask, 6))
    a = np.radians(angle_deg)
    dx, dy = xs - cx, ys - cy
    sx = np.clip(np.round(cx + dx * np.cos(a) - dy * np.sin(a)).astype(int), 0, img.shape[1] - 1)
    sy = np.clip(np.round(cy + dx * np.sin(a) + dy * np.cos(a)).astype(int), 0, img.shape[0] - 1)
    filled = img.copy()
    filled[ys, xs] = low[ys, xs] + hf[sy, sx]
    w = np.clip(blur(mask.astype(np.float32), 3) * 1.6, 0, 1)[..., None]
    return img * (1 - w) + filled * w


# --------------------------------------------------------------------- maps
def make_maps(img, cx, cy, pupil_r, iris_r):
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.hypot(xx - cx, yy - cy)
    lum = luminance(img)
    sat = img.max(axis=-1) - img.min(axis=-1)
    box = (
        int(max(cy - iris_r - 40, 0)),
        int(min(cy + iris_r + 40, h)),
        int(max(cx - iris_r - 40, 0)),
        int(min(cx + iris_r + 40, w)),
    )

    # 1. Pupil: replace the reflected scene with a flat deep black, keep the
    #    pupil margin from the photo.
    inner = r < pupil_r * 0.98
    deep = np.percentile(img[inner].reshape(-1, 3), 5, axis=0)
    k = 1 - smoothstep(pupil_r * 0.80, pupil_r * 0.97, r)
    clean = img * (1 - k[..., None]) + deep * k[..., None]

    # 2. Iris highlights: the painted reflections are bright and nearly grey
    #    (saturation ~0.03), while even the palest iris fibers stay tinted
    #    (~0.11). An opening (erode, then grow) drops isolated grey specks.
    spots = (sat < 0.06) & (lum > 0.45) & (r > pupil_r * 0.9) & (r < iris_r * 0.97)
    core = box_blur(spots.astype(np.float32), 2) > 0.6  # erode: keep solid blobs
    spots = dilate(core, 8) & (r < iris_r * 0.99)
    clean = radial_fill(clean, spots, box, cx, cy)

    # 3. Normal map from fine luminance detail (band-pass), stronger in the iris.
    clum = luminance(clean)
    height = blur(clum, 1.2) - blur(clum, 10)
    iris_w = 1 - smoothstep(iris_r * 0.95, iris_r * 1.05, r)
    pupil_w = smoothstep(pupil_r * 0.85, pupil_r * 1.0, r)
    height *= 0.35 + 0.65 * iris_w  # sclera: subtle (veins), iris: full
    height *= pupil_w  # pupil: flat
    strength = 6.0
    gx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * strength
    gy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * strength
    # Image rows go down, tangent-space +Y goes up (OpenGL / glTF convention).
    n = np.stack([-gx, gy, np.ones_like(gx)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    normal = n * 0.5 + 0.5

    # 4. Roughness: wet sclera, matte iris, glossy pupil.
    rough = 0.22 + (0.55 - 0.22) * iris_w
    rough = rough * pupil_w + 0.30 * (1 - pupil_w)

    # 5. Clearcoat (tear film) only outside the cornea.
    coat = smoothstep(iris_r * 1.0, iris_r * 1.12, r)

    return {
        "clean": np.clip(clean, 0, 1).astype(np.float32),
        "normal": normal.astype(np.float32),
        "roughness": np.repeat(rough[..., None], 3, axis=-1).astype(np.float32),
        "coat": np.repeat(coat[..., None], 3, axis=-1).astype(np.float32),
        "spots": np.repeat(spots[..., None], 3, axis=-1).astype(np.float32),
    }


# ------------------------------------------------- standalone preview (PIL)
if __name__ == "__main__":
    import sys
    from PIL import Image

    src, out_dir = sys.argv[1], sys.argv[2]
    im = np.asarray(Image.open(src).convert("RGB"), dtype=np.float32) / 255
    h, w, _ = im.shape
    maps = make_maps(im, 0.5071 * w, (1 - 0.4988) * h, 0.0699 * w, 0.205 * w)
    for name, a in maps.items():
        Image.fromarray((a * 255 + 0.5).astype(np.uint8)).save(f"{out_dir}/eye_{name}.png")
    print("written to", out_dir)
