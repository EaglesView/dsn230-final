"""
Rig the pupil of RealisticEye.blend with shape keys + one action per FSM state,
then export a glTF the web app can play.

    blender -b "dump/Blender assets/RealisticEye.blend" \
        --python tools/blender/rig_pupil.py -- \
        "dump/Blender assets/RealisticEye_rig.blend" \
        web/public/models/realistic-eye/RealisticEye.glb

Why: in the original file the pupil animation is procedural (driver frame/100
-> noise -> UV warp in the shader). glTF can't carry shader nodes or drivers,
only transforms, bones and shape keys (morph targets).

How: the eye texture is a photo projected on the sphere's front. If the
vertices of the iris slide along the sphere while their UVs stay fixed, the
photo stretches around the pupil: moving them away from the center magnifies
the pupil (dilate), toward it shrinks it (constrict). That is a shape key.

The original sphere is too coarse for that (and its poles are elsewhere), so
a new sphere is built with its pole exactly on the pupil and dense rings in
the iris; its UVs are copied from the original by nearest-surface lookup.

The source file is not modified; the result is saved as a new .blend.
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Quaternion, Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eye_textures  # noqa: E402  (pure numpy, next to this file)

argv = sys.argv[sys.argv.index("--") + 1 :]
OUT_BLEND, OUT_GLB = argv[0], argv[1]

# Measured on eyeball.jpg (Blender UV space, v up).
PUPIL_UV = Vector((0.5071, 0.4988))
IRIS_R_UV = 0.205

SEGMENTS = 96
RINGS_IRIS = 32  # rings between the pupil center and the iris edge
RINGS_REST = 36  # rings from the iris edge to the back pole

# Anatomy (eye radius R = 1): the iris is a nearly flat disc recessed at the
# limbus plane, under a clear dome (the cornea). Real eye: radius 12 mm,
# cornea radius ~7.8 mm, anterior chamber ~3 mm deep.
IRIS_BULGE = 0.04  # the iris rises slightly toward the pupil (pushed by the lens)
CORNEA_R = 0.65  # cornea sphere radius, in eye radii
CORNEA_IOR = 1.376
CORNEA_THICKNESS = 0.30  # used by the renderer for refraction (~ chamber depth)

# Radial warp in the iris disc (x = distance to the pupil / iris radius, 0..1):
#   r' = r * (1 + a * (1 - x)^2)
# monotonic for -1 < a < 3, and the iris edge never moves.
DILATE_A = 1.5  # pupil ~1.6x larger
CONSTRICT_A = -0.85  # pupil ~0.6x smaller
FULL_A = 2.1  # "fully open" (~1.9x), driven by the app on click / button press

FPS = bpy.context.scene.render.fps
# (seconds, pupil) — pupil > 0 constricted, < 0 dilated. First == last so clips loop.
STATE_CLIPS = {
    "Boot": [(0, -0.8), (1.5, -0.6), (3, -0.8)],
    "Connecting": [(0, -0.6), (0.75, -0.3), (1.5, -0.6)],
    "Idle": [(0, 0.3), (1, -0.1), (2.2, 0.45), (3.2, 0.15), (4, 0.3)],
    "Scene1": [(0, 0.1), (1.5, 0.25), (3, 0.1)],
    "Scene2": [(0, -0.5), (0.4, -0.7), (0.8, -0.5), (1.6, -0.65), (2.4, -0.5)],
    "Scene3": [(0, 0.2), (0.12, 0.6), (0.3, 0.25), (0.45, 0.55), (1, 0.2)],
    "Error": [(0, 0.9), (0.08, 0.3), (0.16, 0.95), (0.3, 0.5), (0.38, 1.0), (0.6, 0.9)],
}

old = bpy.data.objects["Sphere"]
camera = bpy.data.objects.get("Camera")

# ---- 1. Read the original surface (with its subdivision) -------------------
depsgraph = bpy.context.evaluated_depsgraph_get()
src = old.evaluated_get(depsgraph).to_mesh()
src.calc_loop_triangles()
uv_data = src.uv_layers.active.data
tris = [(t.vertices[:], t.loops[:]) for t in src.loop_triangles]
co = [v.co.copy() for v in src.vertices]
uv3 = lambda loop: Vector((uv_data[loop].uv.x, uv_data[loop].uv.y, 0.0))
bvh = BVHTree.FromPolygons(co, [t[0] for t in tris])
radius = sum(c.length for c in co) / len(co)


def points_with_uv(target):
    """Every surface point whose UV is `target` (front and back hemispheres)."""
    hits = []
    t3 = Vector((target.x, target.y, 0.0))
    for verts, loops in tris:
        a, b, c = (uv3(l) for l in loops)
        p = barycentric_transform(t3, a, b, c, co[verts[0]], co[verts[1]], co[verts[2]])
        # Inside test: map back and compare barycentric weights via area signs.
        def side(p1, p2, p3):
            return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
        d1, d2, d3 = side(t3, a, b), side(t3, b, c), side(t3, c, a)
        neg = d1 < 0 or d2 < 0 or d3 < 0
        pos = d1 > 0 or d2 > 0 or d3 > 0
        if not (neg and pos):
            hits.append(p)
    return hits


def front(points):
    """The candidate facing the camera (the photo is projected on both sides)."""
    cam = old.matrix_world.inverted() @ camera.matrix_world.translation
    return min(points, key=lambda p: (p - cam).length)


pupil_pt = front(points_with_uv(PUPIL_UV))
axis = pupil_pt.normalized()
edge_pt = min(points_with_uv(PUPIL_UV + Vector((IRIS_R_UV, 0))), key=lambda p: (p - pupil_pt).length)
theta_iris = axis.angle(edge_pt.normalized())
print(f"[rig] radius {radius:.3f}  pupil axis {tuple(round(x, 3) for x in axis)}  iris {math.degrees(theta_iris):.1f} deg")

# ---- 2. New sphere, pole on the pupil ---------------------------------------
to_axis = Vector((0, 0, 1)).rotation_difference(axis)
thetas = [theta_iris * i / RINGS_IRIS for i in range(RINGS_IRIS + 1)]
thetas += [theta_iris + (math.pi - theta_iris) * i / RINGS_REST for i in range(1, RINGS_REST + 1)]

bm = bmesh.new()
rings = []
for th in thetas:
    if th == 0 or th == math.pi:
        rings.append([bm.verts.new(to_axis @ Vector((0, 0, math.cos(th) * radius)))])
        continue
    ring = []
    for s in range(SEGMENTS):
        ph = 2 * math.pi * s / SEGMENTS
        local = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th))) * radius
        ring.append(bm.verts.new(to_axis @ local))
    rings.append(ring)
for a, b in zip(rings, rings[1:]):
    for s in range(SEGMENTS):
        s2 = (s + 1) % SEGMENTS
        if len(a) == 1:
            bm.faces.new((a[0], b[s], b[s2]))
        elif len(b) == 1:
            bm.faces.new((a[s], b[0], a[s2]))
        else:
            bm.faces.new((a[s], b[s], b[s2], a[s2]))
for f in bm.faces:
    f.smooth = True
bm.normal_update()
# Faces must point outward.
if sum((f.normal.dot(f.calc_center_median())) for f in bm.faces) < 0:
    bmesh.ops.reverse_faces(bm, faces=bm.faces[:])

# UVs: nearest point on the original surface, interpolated in its triangle.
uv_layer = bm.loops.layers.uv.new("UVMap")
vert_uv = {}
for v in bm.verts:
    loc, _n, idx, _d = bvh.find_nearest(v.co)
    verts, loops = tris[idx]
    uv = barycentric_transform(loc, co[verts[0]], co[verts[1]], co[verts[2]], *(uv3(l) for l in loops))
    vert_uv[v] = (uv.x, uv.y)
for f in bm.faces:
    for loop in f.loops:
        loop[uv_layer].uv = vert_uv[loop.vert]

# Flatten the iris: vertices inside the limbus move onto a disc at the limbus
# plane (+ a slight dome). The UVs stay, so the photo now lies on the disc.
rho_i = radius * math.sin(theta_iris)
z_i = radius * math.cos(theta_iris)


def iris_point(x, u):
    """Point on the iris disc at normalized radius x (0..1) in direction u."""
    return axis * (z_i + IRIS_BULGE * radius * (1 - x * x)) + u * (rho_i * x)


def radial_dir(co):
    u = co - axis * co.dot(axis)
    return u.normalized() if u.length > 1e-9 else Vector((0, 0, 0))


for v in bm.verts:
    th = axis.angle(v.co.normalized())
    if th < theta_iris - 1e-6:
        v.co = iris_point(th / theta_iris, radial_dir(v.co))
# Iris faces get their own material slot (1): see "Iris" material below.
for f in bm.faces:
    if all(axis.angle(v.co.normalized()) < theta_iris + 1e-4 for v in f.verts):
        f.material_index = 1
# The limbus is a crease (iris disc meets sclera): keep normals split there.
for e in bm.edges:
    if all(abs(axis.angle(v.co.normalized()) - theta_iris) < 1e-4 for v in e.verts):
        e.smooth = False
bm.normal_update()

me = bpy.data.meshes.new("EyeRig")
bm.to_mesh(me)
bm.free()
me.materials.append(old.data.materials[0])

eye = bpy.data.objects.new("Eye", me)
for col in old.users_collection:
    col.objects.link(eye)
eye.matrix_world = old.matrix_world.copy()

# ---- 3. Shape keys -----------------------------------------------------------
def warp_key(name, a):
    """Slide iris-disc vertices radially (UVs fixed) so the photographed
    pupil grows (a > 0) or shrinks (a < 0); the limbus doesn't move."""
    key = eye.shape_key_add(name=name, from_mix=False)
    for i, v in enumerate(me.vertices):
        if v.co.dot(axis) < z_i - 1e-6:  # sclera
            continue
        u = radial_dir(v.co)
        x = (v.co - axis * v.co.dot(axis)).length / rho_i
        if x >= 1:
            continue
        key.data[i].co = iris_point(min(x * (1 + a * (1 - x) ** 2), 1.0), u)
    key.slider_min, key.slider_max = 0.0, 1.0
    return key


eye.shape_key_add(name="Basis", from_mix=False)
k_dil = warp_key("PupilDilate", DILATE_A)
k_con = warp_key("PupilConstrict", CONSTRICT_A)
# Not used by the state clips: the app blends it in over any clip while pressed.
k_full = warp_key("PupilFull", FULL_A)

# Bake the orientation into the mesh: pupil along Blender -Y (= glTF +Z, the
# web app's forward axis), identity object transform.
eye.matrix_world.identity()
me.transform(axis.rotation_difference(Vector((0, -1, 0))).to_matrix().to_4x4(), shape_keys=True)
me.update()
FWD = Vector((0, -1, 0))  # pupil axis from now on (glTF +Z)

# ---- 3b. Cornea: a clear dome over the iris -----------------------------------
# Sphere of radius CORNEA_R through the limbus circle; the cap continues a few
# degrees past the limbus, where it is already inside the eyeball (hidden).
rc = CORNEA_R * radius
c_off = z_i - math.sqrt(rc * rc - rho_i * rho_i)
phi_i = math.asin(rho_i / rc)
phi_max = phi_i + math.radians(5)
to_fwd = Vector((0, 0, 1)).rotation_difference(FWD)
bm = bmesh.new()
cap = [[bm.verts.new(to_fwd @ Vector((0, 0, c_off + rc)))]]
C_RINGS, C_SEG = 40, 96
for i in range(1, C_RINGS + 1):
    ph = phi_max * i / C_RINGS
    cap.append([
        bm.verts.new(to_fwd @ Vector((rc * math.sin(ph) * math.cos(t), rc * math.sin(ph) * math.sin(t), c_off + rc * math.cos(ph))))
        for t in (2 * math.pi * s / C_SEG for s in range(C_SEG))
    ])
for a, b in zip(cap, cap[1:]):
    for s in range(C_SEG):
        s2 = (s + 1) % C_SEG
        bm.faces.new((a[0], b[s], b[s2]) if len(a) == 1 else (a[s], b[s], b[s2], a[s2]))
for f in bm.faces:
    f.smooth = True
bm.normal_update()
if sum(f.normal.dot(f.calc_center_median() - FWD * c_off) for f in bm.faces) < 0:
    bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
cornea_me = bpy.data.meshes.new("Cornea")
bm.to_mesh(cornea_me)
bm.free()
cornea = bpy.data.objects.new("Cornea", cornea_me)
for col in eye.users_collection:
    col.objects.link(cornea)

cm = bpy.data.materials.new("Cornea")
cm.use_nodes = True
cb = cm.node_tree.nodes["Principled BSDF"]
cb.inputs["Base Color"].default_value = (1, 1, 1, 1)
cb.inputs["Roughness"].default_value = 0.0
cb.inputs["Transmission Weight"].default_value = 1.0
cb.inputs["IOR"].default_value = CORNEA_IOR
# Thickness for the glTF volume extension (refraction depth in real-time engines).
gltf_out = bpy.data.node_groups.get("glTF Material Output")
if gltf_out is None:
    gltf_out = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    gltf_out.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    gltf_out.interface.new_socket("Thickness", in_out="INPUT", socket_type="NodeSocketFloat")
gnode = cm.node_tree.nodes.new("ShaderNodeGroup")
gnode.node_tree = gltf_out
gnode.inputs["Thickness"].default_value = CORNEA_THICKNESS
cornea_me.materials.append(cm)
print(f"[rig] cornea apex {c_off + rc:.3f}, iris plane {z_i:.3f}, chamber {c_off + rc - z_i:.3f}")

# ---- 4. One action per FSM state, each on its own NLA track -----------------
shape_keys = me.shape_keys
ad = shape_keys.animation_data_create()
for state, keys in STATE_CLIPS.items():
    act = bpy.data.actions.new(state)
    ad.action = act
    for t, p in keys:
        frame = 1 + round(t * FPS)
        k_dil.value = max(-p, 0.0)
        k_con.value = max(p, 0.0)
        k_dil.keyframe_insert("value", frame=frame)
        k_con.keyframe_insert("value", frame=frame)
    ad.action = None
    track = ad.nla_tracks.new()
    track.name = state
    track.strips.new(state, 1, act)
k_dil.value = k_con.value = 0.0

# ---- 5. Textures + material ----------------------------------------------------
# Derived maps (see eye_textures.py): photo without its painted reflections,
# normal map from the iris/vein detail, roughness, clearcoat (tear film) mask.
src_img = bpy.data.images["eyeball.jpg"]
W, H = src_img.size
px = np.empty(W * H * 4, dtype=np.float32)
src_img.pixels.foreach_get(px)
photo = px.reshape(H, W, 4)[::-1, :, :3]  # Blender rows go up; make_maps wants top-down
maps = eye_textures.make_maps(
    photo, PUPIL_UV.x * W, (1 - PUPIL_UV.y) * H, 0.0699 * W, IRIS_R_UV * W
)


def to_image(name, rgb, data=True):
    img = bpy.data.images.get(name) or bpy.data.images.new(name, W, H, alpha=False)
    # Set the color space BEFORE writing: changing it reloads a generated
    # image and wipes its pixels (that gave all-black data maps).
    if data:
        try:
            img.colorspace_settings.name = "Non-Color"
        except TypeError:
            pass  # color management in fallback mode: no named spaces
    rgba = np.concatenate([rgb[::-1], np.ones((H, W, 1), np.float32)], axis=-1)
    img.pixels.foreach_set(rgba.ravel())
    img.update()
    img.file_format = "PNG"
    img.pack()
    return img


im_color = to_image("eye_color", maps["clean"], data=False)
im_normal = to_image("eye_normal", maps["normal"])
im_rough = to_image("eye_roughness", maps["roughness"])
im_coat = to_image("eye_coat", maps["coat"])

nt = old.data.materials[0].node_tree
if nt.animation_data:
    for d in list(nt.animation_data.drivers):
        nt.animation_data.drivers.remove(d)
bsdf, uvnode = nt.nodes["Principled BSDF"], nt.nodes["Texture Coordinate.001"]
# Drop the procedural graph's inputs into the BSDF; wire plain image textures.
for link in list(nt.links):
    if link.to_node == bsdf:
        nt.links.remove(link)


def tex(img, x, y):
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = img
    n.location = (x, y)
    nt.links.new(uvnode.outputs["UV"], n.inputs["Vector"])
    return n


nt.links.new(tex(im_color, -500, 400).outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(tex(im_rough, -500, 100).outputs["Color"], bsdf.inputs["Roughness"])
nmap = nt.nodes.new("ShaderNodeNormalMap")
nmap.location = (-200, -200)
nmap.inputs["Strength"].default_value = 1.0
nt.links.new(tex(im_normal, -500, -200).outputs["Color"], nmap.inputs["Color"])
nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
nt.links.new(tex(im_coat, -500, -500).outputs["Color"], bsdf.inputs["Coat Weight"])
bsdf.inputs["Coat Roughness"].default_value = 0.05
bsdf.inputs["Coat IOR"].default_value = 1.336  # tear film

# Iris + pupil: same maps, but no specular and no coat. In a real eye the iris
# sits in aqueous humor (IOR ~1.336, close to its own), so its surface barely
# reflects; the cornea above carries the reflections. Without this the iris
# looks hazy and the pupil grey instead of black.
iris_mat = old.data.materials[0].copy()
iris_mat.name = "Iris"
ib = iris_mat.node_tree.nodes["Principled BSDF"]
ib.inputs["Specular IOR Level"].default_value = 0.0
for link in list(iris_mat.node_tree.links):
    if link.to_node == ib and link.to_socket.name == "Coat Weight":
        iris_mat.node_tree.links.remove(link)
ib.inputs["Coat Weight"].default_value = 0.0
me.materials.append(iris_mat)

# ---- 6. Export, then save the rig file ---------------------------------------
old.name = "Sphere_original"
old.hide_render = True
old.hide_set(True)
bpy.ops.object.select_all(action="DESELECT")
eye.select_set(True)
cornea.select_set(True)
bpy.context.view_layer.objects.active = eye
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="WEBP",
    export_image_quality=92,
    export_morph=True,
    export_morph_normal=False,  # vertices slide within the iris disc: normals barely change
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_force_sampling=True,
    export_cameras=False,
    export_lights=False,
)

# For previewing in Blender: only Idle plays; un-mute (or solo) another track to see it.
for track in ad.nla_tracks:
    track.mute = track.name != "Idle"
bpy.context.scene.frame_start, bpy.context.scene.frame_end = 1, 1 + 4 * FPS
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, copy=False)
print("[rig] saved", OUT_BLEND, "and", OUT_GLB)
