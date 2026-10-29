# DSN230 - Projet Final

Dépôt de l'expérience interactive bâti dans le cours DSN-230 du programme de Baccalauréat en Design UX à l'École de Technologie Supérieure (ÉTS).

Le but du projet est de créer une expérience interactive au tour d'un oeuil, possiblement contrôlé par touch designer. Les réactions face à l'oeuil, que ce soit engagés de facon tactile, par mouvement, ou par son, feront réagir les utilisateurs.

## Coéquipiers
- Laurian Deslauney
- Zachary Courchesne
- Éloïse Marcellus Clapin
- Jean-Marc Bouchard

## Structure du dépôt

| Chemin | Qu'est-ce qui à la-dedans? |
|------|--------------|
| `firmware/esp32_controller/` | Code Arduino, machine à états finis, et le code du micro-controlleur. |
| `touchdesigner/` | Toute la partie microcontrolleur |
| `hardware/` | Informations et tableaux sur les composantes, pinout, etc. |
| `docs/` | Notes d'architectures, diagrammes de conception, etc. |

## quick start

1. Ouvrir `firmware/esp32_controller/esp32_controller.ino` dans l'IDE Arduino avec les paquets esp32 installés.
2. Installer les libraries (Library Manager):
   - **OSC** (CNMAT / Adrian Freed)
   - **ESP32Wiimote** (bigw00d)
3. Modifier `config.h`: paramètrer le wifi et l'addresse IP de l'ordinateur qui roule TouchDesigner
4. Flash l'ESP32. Ouvrir le *Serial Monitor* a `115200` pour voir les changements d'état
5. Appuyer sur **1 + 2** sur la wiimote pour la connection.

> Pas de wiimote?  `USE_WIIMOTE_LIB 0` dans
> `WiimoteInput.h` pour compiler sans la wiimote".

## La machine à états finis

voir [`docs/architecture.md`](docs/architecture.md) pour le diagramme d'états complet.
Les scènes sont définis dans `Scenes.h` et toutes les transitions sont dans `StateMachine::decide()`.

## TEMPORAIRE - Contrôles

| Wii button | Event | Effect |
|------------|-------|--------|
| A / + | `NextScene` | avancer la prochaine scène |
| B / − | `PrevScene` | reculer d'une scène |
| HOME | `Home` | retourner à `Idle` |
allo
