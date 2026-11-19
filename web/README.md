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
    createRenderer.js   WebGL 2 ou WebGPU (choix au runtime, WebGPU chargé à la demande)
    EyeScene.js         scène three.js pure: modèle, IBL, lumières, logique du regard
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

Le PBR fonctionne déjà en WebGL: le modèle utilise `MeshPhysicalMaterial`
(base color, normal maps, rugosité, transmission `KHR_materials_transmission`)
éclairé par une IBL (`RoomEnvironment` + `PMREMGenerator`) avec tone mapping AgX.

Le moteur se change dans **Admin → Rendu → Moteur de rendu**. `WebGPU` utilise
`WebGPURenderer` (`three/webgpu`) avec les mêmes matériaux; si le navigateur n'a pas
WebGPU, three se replie sur son backend WebGL 2. Rien d'autre à changer dans le code.

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
