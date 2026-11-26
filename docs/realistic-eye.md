# The realistic eye: from a Blender shader to animated glTF

This note explains how `dump/Blender assets/RealisticEye.blend` became the animated
eye the web app plays: what was wrong with the first export, why the pupil
animation was lost, how it was rebuilt as exportable geometry, how the web app
plays it per FSM state (including the click-to-dilate press), and the render
detail pass (cornea, recessed iris, cleaned texture, PBR maps).

Files involved:

| File | Role |
|------|------|
| `dump/Blender assets/RealisticEye.blend` | Source file. **Not modified.** |
| `tools/blender/rig_pupil.py` | Blender script that builds the rig and exports the GLB |
| `tools/blender/eye_textures.py` | numpy: cleaned colour, normal, roughness and clearcoat maps from the photo |
| `dump/Blender assets/RealisticEye_rig.blend` | Output: rigged eye, editable in Blender |
| `web/public/models/realistic-eye/RealisticEye.glb` | Output: what the web app loads |
| `web/src/three/models.js` | Adapts the loaded model; exposes `setPupil` / `applyPress` |
| `web/src/three/EyeScene.js` | Plays the state clips, blends the press, aims the eye |
| `web/src/three/createRenderer.js` | WebGPURenderer (WebGPU, or forced WebGL 2) |

---

## 1. What was in the first export

The first GLB (`dump/Blender assets/RealisticEye.glb`) contained much less than the
Blender scene:

- **One UV sphere, one material.** The colour map is `eyeball.jpg`, which is a
  *photo/render of an eyeball* projected flat onto the front of the sphere. UV
  `(0.5, 0.5)` is the pupil; the back hemisphere gets the same projection.
- **No real animation.** It had one clip, `SphereAction.002`, holding a single
  rotation keyframe (the object's tilt for the Blender camera).
- **A wrong normal map.** In Blender, a *Bump* node feeds the clearcoat normal. The
  exporter can't express a bump, so it wired the colour JPEG in as the
  clearcoat normal map. A photo used as a normal map gives random bumps.
- **The subdivision modifier was not applied** (514 vertices, faceted silhouette).

Inspecting the `.blend` headless (`blender -b … --python`) showed where the
"retina animation" actually lived: **in the material's node graph.**

```
driver: frame / 100
  -> Noise Texture (1D, W input)
  -> Map Range (0..1 -> 0.06..-0.5)       = "From Min" of the next Map Range
  -> Map Range (distance to UV center)     falloff around the iris
  -> Vector Math: (UV - 0.5) * (1 + f) + 0.5
  -> Image Texture vector                  the photo, warped around the pupil
```

Scaling the UVs around the pupil centre makes the photographed pupil grow and
shrink, which is a "breathing" pupil.

**Why it was lost:** glTF can store mesh data, materials (images and factors),
object transforms, armatures (bones) and shape keys (morph targets). It cannot
store shader node graphs or drivers. The exporter kept the image and dropped
everything in between.

---

## 2. First attempt: the warp as a shader in the app (replaced)

The first fix reimplemented the UV warp as a TSL shader in three.js, driven by a
`pupil` uniform. It worked, and it led to one change that we kept:
**both renderer options now go through `WebGPURenderer`** (the "WebGL 2" option
is `WebGPURenderer` with `forceWebGL: true`). TSL node materials only run on that
renderer, and one rendering path is simpler than two.

The shader approach was replaced because the animation then lived in app code,
not in Blender. The goal is for the team to author per-state animation in Blender.

---

## 3. The idea: the warp as geometry

The shader warps **UVs while the vertices stay fixed**. The same visual result comes
from **moving the vertices while the UVs stay fixed**: if iris vertices slide away
from the pupil along the sphere, the photo stretches with them and the pupil gets
bigger. Moving vertices is exactly what a **shape key** does, and shape keys export
to glTF as **morph targets**, which three.js plays natively.

Two conditions:
1. **Enough vertices in the iris.** The original sphere has only a handful there.
2. **Radial symmetry around the pupil.** The original sphere's poles are elsewhere,
   so its rings don't follow the iris.

So the script builds a new sphere, centred on the pupil.

---

## 4. The Blender script (`tools/blender/rig_pupil.py`)

Run it headless; it reads the original file and writes the two outputs:

```bash
blender -b "dump/Blender assets/RealisticEye.blend" \
  --python tools/blender/rig_pupil.py -- \
  "dump/Blender assets/RealisticEye_rig.blend" \
  web/public/models/realistic-eye/RealisticEye.glb
```

### 4.1 Find the pupil on the surface

- The pupil centre was measured in `eyeball.jpg` (centroid of the dark pixels):
  UV `(0.5071, 0.4988)`; iris radius read at about `0.205` in UV.
- The original mesh is evaluated **with** its subdivision. For every triangle, the
  script checks whether the target UV falls inside its UV triangle, and if so maps
  it to 3D with `mathutils.geometry.barycentric_transform`.
- Because the photo is projected on both hemispheres, that gives two hits. The one
  **closest to the scene camera** is the front.
- Result: the pupil axis (a unit vector from the centre) and the iris's angular
  radius, **33.4°**.

### 4.2 Build a sphere whose pole is the pupil

A custom UV-sphere is built with `bmesh`, pole on the pupil axis:

- 96 segments.
- **32 rings inside the iris** (0° → 33.4°) and 36 rings for the rest (33.4° → 180°),
  so the iris gets most of the density. That's about 6,400 vertices, smooth-shaded,
  with outward-facing normals.

### 4.3 Copy the UVs from the original

For each new vertex, a `BVHTree` built from the original (subdivided) triangles
gives the nearest surface point. The UV is the barycentric interpolation of that
triangle's UVs. The new sphere therefore shows exactly the same photo, at a much
higher resolution.

> Bug worth knowing: UVs were first stored by `v.index`. Freshly created bmesh
> vertices all share index −1 until `index_update()`, so every vertex got the same
> UV and the eye rendered as a black ball. The fix keys the map by the vertex itself.

### 4.4 The shape keys

The iris is a flat disc (see [section 8](#8-render-detail-pass)). Every iris vertex at
distance `r` from the pupil centre slides along the disc, in the same direction, to
a new distance:

```
x  = r / r_iris                      0 at the pupil centre, 1 at the iris edge
r' = r · (1 + a · (1 − x)²)
```

(The first version did the same along the sphere, with angles instead of
distances.)

- `a > 0` pushes vertices outward, so the pupil looks **bigger**.
- `a < 0` pulls them inward, so the pupil looks **smaller**.
- At `x = 1` nothing moves, so **the iris edge stays put** and never smears into
  the white of the eye.
- The mapping stays monotonic (no folding) for `−1 < a < 3`.
- Vertices stay on the disc, so normals barely change and morph normals aren't
  exported.

| Shape key | `a` | Pupil size (approx.) | Used by |
|-----------|-----|----------------------|---------|
| `PupilDilate` | 1.5 | ×1.65 | state clips |
| `PupilConstrict` | −0.85 | ×0.6 | state clips |
| `PupilFull` | 2.1 | ×1.9 | the app's press only |

Pupil size ≈ `1 + a · 0.436`, since the pupil sits at about x = 0.34 of the iris.
`PupilFull` was 2.6 (×2.1) at first, then reduced 10% to 2.1 (×1.9).

### 4.5 One action per FSM state

Each state gets an action that keys `PupilDilate` / `PupilConstrict`. A single
"pupil" value `p` drives both: `p > 0` constricted, `p < 0` dilated. Each action
is placed on its own **NLA track named after the state**. The first and last
keyframes are equal, so every clip loops cleanly.

| Clip | Length | Behaviour |
|------|--------|-----------|
| `Boot` | 3 s | wide open, slow |
| `Connecting` | 1.5 s | open, "searching" pulse |
| `Idle` | 4 s | gentle breathing around neutral |
| `Scene1` | 3 s | slightly constricted |
| `Scene2` | 2.4 s | dilated, fascinated flutter |
| `Scene3` | 1 s | heartbeat double pulse |
| `Error` | 0.6 s | strongly constricted, flickering |

The timings and values are the `STATE_CLIPS` table at the top of the script.

### 4.6 Orientation, material, export

- **Orientation is baked in.** The mesh is rotated so the pupil points along
  Blender −Y (= glTF +Z, the app's forward axis), and the object transform is
  cleared. The app needs no correction.
- **Material:** the driver is removed, and plain image textures replace the
  procedural graph (no shader warp, which would otherwise double the effect in
  Blender). The Bump → Coat Normal link is gone, so the broken normal map doesn't
  come back. The materials themselves are described in section 8.
- **Export:** GLB, *Apply Modifiers*, shape keys on, morph normals off, animation
  mode **NLA Tracks** (one glTF animation per track), textures as **WebP**. The
  result is about 1 MB: eye + cornea, 3 morph targets, 7 clips, 4 texture maps.
- **Saved .blend:** the original sphere is kept but hidden (`Sphere_original`).
  Only the `Idle` track is un-muted so playback previews one clip.

---

## 5. Playing it in the web app

### 5.1 Loading (`models.js`)

`setupRealistic()` finds the mesh with morph targets and returns handles:

```js
setPupil(p)    // p in -1..1 -> PupilDilate / PupilConstrict weights
getPupil()     // reads the current weights back (for telemetry)
applyPress(k)  // blends PupilFull over whatever is there
```

### 5.2 State clips (`EyeScene.js`)

A `THREE.AnimationMixer` holds every clip, indexed by name. When the FSM state
changes, the clip with the **same name** fades in over 0.4 s and the previous one
fades out. Name a Blender action `Scene2` and it plays in `Scene2`, with no code
change.

Every frame, in this order:

1. `mixer.update(dt)` writes the clip's morph weights.
2. **Pupil:**
   - **Auto mode** (default): the clip drives it. If a state has no clip, a fallback
     target per state plus a little noise is used.
   - **Manual mode:** the dashboard slider drives `setPupil()` directly.
3. **Press:** `applyPress(k)` scales the clip's weights by `1 − k` and sets
   `PupilFull = k`.

### 5.3 The press: click to open fully

`k` eases toward 1 while pressed and toward 0 when released: fast in
(about 0.15 s), slower out (about 0.5 s). Because the mixer rewrites the clip
weights every frame and the press is applied afterwards, **the clip never stops**.
On release, the pupil eases straight back into the state animation wherever it
has got to.

Press sources (`lib/gaze.js`):

- mouse button held on the display (`/`);
- the **Maintenir: pupille ouverte** button in `/admin` → Suivi de l'oeil (also
  Space / Enter);
- the WebSocket bridge: `{"press": true}` / `{"press": false}` (for a Wii remote
  button later).

---

## 6. How it was checked

- Headless Chromium (Playwright, software rendering) on WebGL 2 and WebGPU:
  manual pupil −1 / 0 / +1, the eye looking off to the side, and the `Error` and
  `Idle` clips sampled over time from the debug overlay (the values change, so the
  clips play).
- The press: before / held / released, from the mouse and from the dashboard
  button in another tab. The pressure reached 1.00 while held, about 0 after
  release, and the clip value kept moving underneath.
- In Blender: the rig file's NLA tracks are present, and the shape key values
  follow the `Idle` keys across frames.

---

## 7. Editing and limits

**To change the animations:**
- Open `RealisticEye_rig.blend` and edit the keys on the NLA tracks (un-mute or
  solo a track to preview it). Re-export with animation mode *NLA Tracks*.
- Or edit `STATE_CLIPS` / the `a` values in the script and re-run it.
- New track names must match the FSM state names exactly.
- Don't animate the eye's root rotation: the app uses it for the gaze.

**Known limits:**
- **Some lighting is still painted into the photo.** The visible reflections were
  removed (section 8.2), but the soft shading painted into the iris relief remains.
  A texture captured under flat light would fix that completely.
- **Transmission is approximated.** three.js refracts a screen-space image of what
  is behind the cornea, which is convincing but not ray-traced.
- **Unknown texture licence.** `eyeball.jpg` came from a Downloads folder; check
  its source before showing the project publicly.
- **Iris compression at full press.** The pupil can't grow indefinitely without
  squeezing the iris into a thin ring. `PupilFull`'s `a` (now 2.1) controls that
  trade-off.

---

## 8. Render detail pass

Goal: as much realism as the real-time renderer allows, still built by the script
so the `.blend` stays the source.

### 8.1 Anatomy: recessed iris + cornea

A real eye is not a painted sphere. The iris is a nearly flat disc sitting about
3 mm behind a clear dome, the **cornea**. The refraction and the reflections on
that dome are what make eyes look wet and deep.

- **Flat iris.** Iris vertices move onto a disc at the limbus plane, with a slight
  dome toward the pupil (`IRIS_BULGE = 0.04`, as the lens pushes the real iris
  forward). UVs don't change, so the photo now lies on the disc. The limbus edges
  are marked sharp, so the crease between disc and sclera keeps clean normals.
- **Cornea.** A second object, `Cornea`: a spherical cap of radius 0.65 × the eye
  radius (real eye: 7.8 mm / 12 mm) passing through the limbus circle. It
  continues 5° past the limbus, where it is already inside the eyeball and hidden,
  so there is no seam.
  - Result: apex at 1.132, iris plane at 0.829, a **chamber 0.302 deep** (about
    3.6 mm at real scale; a real one is about 3 mm).
  - Material: transmission 1, roughness 0, **IOR 1.376** (real cornea). The
    thickness, 0.30, comes from a `glTF Material Output` node group, which the
    exporter turns into `KHR_materials_volume`. Real-time engines use it to
    offset the refraction, so the iris shifts behind the dome as the eye turns.

### 8.2 Texture maps (`tools/blender/eye_textures.py`)

Pure numpy functions, called by the rig script. The same file can also be run
alone with plain Python to preview the maps as PNGs.

| Map | How |
|-----|-----|
| **Colour (cleaned)** | The pupil's painted reflection (a "skyline") is replaced by flat deep black, keeping the pupil margin. Iris reflections are found as pixels that are **bright and nearly grey**: saturation < 0.06 against ~0.11 for the palest fibres. A small erosion keeps only solid blobs. Each hole is filled with smooth colour (multi-scale diffusion) plus **fibre detail copied from the same radius rotated 50°** around the pupil, since iris fibres are radial. The fill is feathered into the photo. |
| **Normal** | Band-pass of the cleaned luminance (blur 1.2 − blur 10) as a height map. Full strength in the iris (fibres, crypts), 35% on the sclera (veins), flat in the pupil. Converted to an OpenGL/glTF tangent-space normal map. |
| **Roughness** | 0.22 on the sclera (wet), 0.55 on the iris, 0.30 in the pupil. |
| **Clearcoat mask** | 1 on the sclera (tear film, coat roughness 0.05, IOR 1.336), 0 under the cornea. |

> Bug worth knowing: the three data maps first exported **all black**. Changing a
> generated image's colour space reloads it and wipes its pixels, so the colour
> space must be set *before* writing the pixels.

> First detector attempt: "brighter than the neighbourhood" flagged every pale iris
> fibre, and inpainting blurred the whole iris. Saturation is what separates real
> reflections from fibres.

### 8.3 Two materials on the eye

- **`eye` (sclera):** the four maps, clearcoat masked to the sclera.
- **`Iris` (iris + pupil faces):** the same maps, but **no specular**
  (`KHR_materials_specular` factor 0) and no coat. A real iris sits in fluid of
  almost the same refractive index, so it barely reflects; the cornea carries the
  reflections.
  - Without this, the room's reflection on the iris surface made the iris hazy and
    the pupil grey. With it, the pupil is black with clean highlights from the
    cornea.

glTF splits a mesh with two materials into two primitives. three.js loads them as
two meshes, each with the morph targets, so `models.js` drives the pupil on every
mesh that has them. The app also sets anisotropic filtering (×8) on the textures,
so the iris stays sharp at grazing angles.

---

## 9. Image / video in the pupil (hold F)

Holding **F** shows an image or a video "inside" the eye, on a disc over the
pupil. Release, and it closes again.

**Triggers:** F on the display, F or the **Maintenir: afficher (F)** button in
`/admin` → *Média dans la pupille*, or `{"media": true|false}` from the WebSocket
bridge.

**Sources** (`/admin` → *Média dans la pupille*):
- **Démo:** an animated radar drawn on a canvas, so F works with no setup.
- **Fichier:** an image or video picked in the dashboard. It is sent to the
  display tabs as a `Blob` over the BroadcastChannel, and re-sent to displays that
  join later.
- **URL:** an image or video link. The server must allow CORS; videos are
  recognised by their extension.

**How it is drawn** (`createMediaDisc` in `web/src/three/models.js`,
`web/src/three/PupilMedia.js`):
- **Its own mesh.** A circle sitting just in front of the iris dome's apex, under
  the cornea, parented to the eye, so it turns with the gaze. Its radius comes
  from the dashboard slider (*Taille du disque*, in eye radii, 0.2 by default;
  the pupil at rest is about 0.19).
- **Independent of the pupil.** It doesn't stretch with the pupil morph, and
  showing it doesn't open the pupil. (A first version drew the media in the
  pupil's UV area, so it grew and shrank with the pupil; that was changed on
  request.)
- **Opaque, with a shutter fade.** three.js only refracts *opaque* objects through
  a transmissive surface. So the disc uses an alpha-test cut-out instead of
  blending, and it fades in by growing its visible radius from the centre. The
  cornea then refracts and reflects over it, like the iris.
- **Fit and colour.** Cover-fit: the media's long side is cropped to fill the
  circle. Colours are shown as-is, without tone mapping, so the media looks like a
  screen.
- **Video playback.** Videos play while shown and pause when hidden. The demo
  canvas only redraws while visible.
