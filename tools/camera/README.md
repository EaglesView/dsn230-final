# tools/camera — suivi des gens par caméra

Petit serveur Python: OpenCV repère les visages devant la caméra, choisit la personne
la plus proche et envoie à l'oeil où regarder, en WebSocket, dans le même JSON que le
pont ESP32 (`{"x", "y"}` entre -1 et 1). Personne → il envoie le centre.

## Pourquoi sur le PC et pas sur l'ESP32

L'ESP32 classique n'a pas d'hôte USB (il ne peut pas lire une webcam USB), il a
~520 Ko de RAM, et il est déjà occupé par le Bluetooth de la Wiimote. Un ESP32-S3
avec son propre module caméra peut faire une détection de visage basique, mais à
basse résolution et peu d'images/s. Le PC fait 18–20 images/s en 640×480 sans effort
(limité par la caméra, pas par le processeur).

## Installation (une fois)

```bash
python3 -m venv tools/camera/.venv
tools/camera/.venv/bin/pip install -r tools/camera/requirements.txt
```

Le modèle de détection (`models/face_detection_yunet_2023mar.onnx`, YuNet, OpenCV Zoo,
licence MIT) est dans le dépôt. S'il manque, le serveur utilise le détecteur Haar
fourni avec OpenCV (moins fiable).

## Lancer

```bash
tools/camera/.venv/bin/python tools/camera/server.py          # ou: cd web && npm run camera
tools/camera/.venv/bin/python tools/camera/server.py --list   # lister les caméras
```

- La caméra USB est choisie automatiquement (la première qui n'est pas « Integrated »),
  sinon `--camera /dev/video2`.
- Aperçu annoté: http://localhost:8787/ — flux pour l'oeil: `ws://localhost:8787`.
- Dans l'admin, panneau **Caméra**: choisir l'état FSM pendant lequel l'oeil suit les gens
  (**Suivre pendant l'état**), ou choisir **Caméra** comme source du regard.

## Réglages utiles

| Option | Défaut | Effet |
|--------|--------|-------|
| `--hold` | 1.0 s | temps avant de revenir au centre quand la personne disparaît |
| `--smoothing` | 10 | lissage (1/s), plus haut = plus vif |
| `--stickiness` | 1.6 | garde la même personne tant qu'une autre n'est pas nettement plus proche |
| `--gain-x`, `--gain-y` | 1.0 | amplitude du regard |
| `--offset-y` | 0 | décale le regard vers le haut (+) ou le bas (−) selon la hauteur de la caméra |
| `--no-mirror` | (miroir) | par défaut l'image est inversée: la caméra fait face au public, comme l'oeil |
| `--host 0.0.0.0` | localhost | servir le réseau local (l'aperçu devient visible sur le réseau) |

## Limites

- Détection de **visages**: une personne de dos ou de profil complet n'est pas vue.
  C'est plutôt cohérent pour un oeil qui regarde les gens qui le regardent.
- Les images ne sont jamais enregistrées sur disque; l'aperçu n'est servi qu'en local
  par défaut.
