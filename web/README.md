# web/ — L'oeil 3D + tableau de bord admin

Application Vite + React + three.js.

| Route | Rôle |
|-------|------|
| `/` | **Affichage**: l'oeil 3D en plein écran (pour le projecteur / l'écran). Suit la souris pour l'instant. |
| `/admin` | **Tableau de bord**: contrôle l'affichage à distance + banc d'essai de tous les composants UI. |

## Démarrer

```bash
cd web
npm install
npm run dev        # http://localhost:5173  (--host: accessible sur le réseau local)
```

Ouvre `/` dans un onglet et `/admin` dans un autre: le tableau de bord pilote l'oeil en direct.

## Architecture

```
src/
  three/
    createRenderer.js   WebGPURenderer, en WebGPU ou forcé en WebGL 2 (choix au runtime)
    models.js           modèles d'oeil disponibles + adaptation (orientation, matériau TSL)
    EyeScene.js         scène three.js pure: modèle, IBL, lumières, regard, pupille, clips
  components/
    EyeCanvas.jsx       monte EyeScene dans React
    ui/                 kit d'interface (repris / inspiré de magix-web3)
    admin/              sections du tableau de bord
  lib/
    gaze.js             sources du regard: souris, pavé XY, WebSocket (ESP32)
    bus.js              canal de contrôle admin <-> affichages
    controls.js         état partagé (scène, moteur, exposition, ...)
    fsm.js              copie JS de StateMachine::decide() du firmware
  pages/
    EyeView.jsx         route /
    Admin.jsx           route /admin
```

### Rendu: WebGL maintenant, WebGPU plus tard

Les deux options passent par `WebGPURenderer` (`three/webgpu`): « WebGL 2 » le force
en WebGL 2, « WebGPU » utilise WebGPU (repli automatique en WebGL 2 si absent). Un seul
chemin de rendu, donc les matériaux écrits en TSL (le langage de shaders de three)
fonctionnent partout. PBR complet: `MeshPhysicalMaterial`, IBL (`RoomEnvironment` +
`PMREMGenerator`), tone mapping AgX.

WebGPU sous Linux (Chromium): lancer avec
`--ozone-platform=x11 --enable-unsafe-webgpu --enable-features=Vulkan --ignore-gpu-blocklist`
(Vulkan n'est pas compatible avec Chromium en mode Wayland).

### Modèles

Choix dans **Admin → Rendu → Modèle** (`src/three/models.js`).

- **Réaliste (Blender)** — généré par `tools/blender/rig_pupil.py` à partir de
  `dump/Blender assets/RealisticEye.blend` (le fichier source n'est pas modifié):

  ```bash
  blender -b "dump/Blender assets/RealisticEye.blend" --python tools/blender/rig_pupil.py -- \
    "dump/Blender assets/RealisticEye_rig.blend" web/public/models/realistic-eye/RealisticEye.glb
  ```

  Dans le .blend d'origine, la pupille est animée dans le shader (driver → bruit → UV),
  ce que le glTF ne peut pas exporter. Le script reconstruit la sphère avec son pôle sur
  la pupille et deux **shape keys** (`PupilDilate`, `PupilConstrict`) qui font glisser les
  sommets de l'iris sur la photo (UV fixes → la pupille grossit / rapetisse), puis crée
  **une action par état** (`Idle`, `Scene1`, … `Error`) sur des pistes NLA.
  Un troisième shape key, `PupilFull`, n'est dans aucun clip: l'app le mélange par-dessus
  l'animation de l'état pendant un **appui** (clic maintenu sur l'affichage, bouton
  « Maintenir » de l'admin, ou `{"press": true|false}` via le pont WebSocket). Au
  relâchement, l'animation de l'état, qui n'a jamais arrêté, reprend la main.
  Pour retoucher les animations: ouvrir `RealisticEye_rig.blend`, éditer les pistes NLA
  (seule `Idle` est active pour la prévisualisation) et réexporter en mode *NLA Tracks*.
- **Classique (Sketchfab)** — le modèle de départ.

### Média dans la pupille (touche F)

Maintenir **F** (sur l'affichage ou l'admin) affiche une image ou une vidéo sur un disque
au-dessus de la pupille, sous la cornée. Taille réglable, indépendante de la pupille.
Source: démo, fichier choisi dans l'admin, ou URL (**Admin → Média dans la pupille**).
Pont WebSocket: `{"media": true|false}`. Détails: `docs/realistic-eye.md` §9.

### Animer dans Blender pour chaque état

Explication complète du pipeline: [`docs/realistic-eye.md`](../docs/realistic-eye.md).

Le glTF exporte: transformations d'objets, os (armature) et shape keys (morph targets).
Il n'exporte **pas** les nodes de shaders ni les drivers. Pour animer par état:

1. Animer avec des shape keys ou des os plutôt qu'avec des nodes (voir
   `RealisticEye_rig.blend`: les shape keys `PupilDilate` / `PupilConstrict`).
2. Nommer chaque action comme l'état: `Idle`, `Scene1`, `Scene2`, `Scene3`, `Error`, …
   L'app joue automatiquement le clip du même nom (fondu de 0.4 s) quand l'état change.
3. Ne pas animer la rotation de l'objet racine: l'app l'utilise pour le regard.
4. Export: *Apply Modifiers* coché (sinon la subdivision est perdue), *Shape Keys* et
   *Animation* cochés.

### Le regard

`EyeScene.frame()` projette le point visé (coordonnées normalisées -1..1) sur un plan
devant l'oeil (« profondeur du point focal ») puis oriente l'oeil vers ce point, avec un
angle maximal et un lissage indépendant du framerate. Sans entrée depuis 4 s, l'oeil fait
des saccades aléatoires (désactivable).

Couleur de la lumière d'appoint selon l'état de la FSM: Idle cyan, Scene1 violet,
Scene2 or, Scene3 vert, Error rouge (pulsé), Boot/Connecting: l'oeil regarde vers le bas.

### Brancher l'ESP32 (à venir)

Un navigateur ne peut pas recevoir de l'OSC/UDP directement. Prévoir un petit pont
(Node, Python, ou TouchDesigner via un *WebSocket DAT*) qui:

1. reçoit l'OSC de l'ESP32 (`/wiimote/...`, `/state`),
2. envoie au navigateur, en WebSocket, du JSON `{"x": 0.2, "y": -0.5}` (ou `{"gaze": [x, y]}`), x/y dans -1..1.

Puis dans **Admin → Suivi de l'oeil**, choisir la source **ESP32** et entrer l'URL du pont
(par défaut `ws://localhost:8787`). Voir `src/lib/gaze.js`.

Le canal admin ↔ affichage (`src/lib/bus.js`) passe par `BroadcastChannel`, donc
seulement entre onglets du même navigateur. Pour contrôler l'installation depuis un autre
appareil, ajouter un transport WebSocket au même pont (même interface `send`/`on`).

Les données des appareils (RSSI, batterie, accéléromètre) dans **Admin → Appareils** sont
**simulées** (`components/admin/useSimulatedDevices.js`) en attendant la vraie télémétrie.

## Crédits

- Modèle 3D: « [Eye PBR Test (Downloadable)](https://sketchfab.com/3d-models/eye-pbr-test-downloadable-f12c63ce28c847fa8041c101f616154b) »
  par [James Truhlar](https://sketchfab.com/mdcrtv), CC-BY-4.0 (`public/models/eye/license.txt`).
- Style de l'interface: repris de *magix-web3* (couleurs, polices, coupes en `clip-path`,
  boutons, checkbox, slider, sélecteur, dialogues), sans les effets de glitch en shader.
