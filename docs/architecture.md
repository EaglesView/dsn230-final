# Architecture

## Signal path

```
Wii Remote ──Bluetooth Classic──▶ ESP32 ──OSC over WiFi/UDP──▶ TouchDesigner
```

- **Wii Remote → ESP32**: Bluetooth Classic via the `ESP32Wiimote` library.
  Buttons become discrete *events*; the accelerometer becomes a live data stream.
- **ESP32**: runs the finite state machine. Events cause state (scene) changes;
  the current scene decides what live data to stream.
- **ESP32 → TouchDesigner**: OSC messages over UDP. TouchDesigner receives them
  with an **OSC In DAT** (for `/state`) and/or **OSC In CHOP** (for numeric
  streams like `/wiimote/accel`).

## Finite state machine

States are declared in `firmware/esp32_controller/Scenes.h`. All transition
logic is in `StateMachine::decide()` (`StateMachine.cpp`) — a pure function of
`(current state, event)`. Side effects (OSC sends) happen only in
`onEnter`/`onExit`/`onUpdate`.

```
        BootDone            Connected
 ┌──────┐        ┌────────────┐        ┌──────┐
 │ Boot │───────▶│ Connecting │───────▶│ Idle │◀───────────┐
 └──────┘        └────────────┘        └──────┘            │ Home
                       ▲                   │ NextScene      │ (from any scene)
          ConnectionLost│                  ▼                │
                   ┌───────┐           ┌────────┐           │
                   │ Error │           │ Scene1 │───────────┤
                   └───────┘           └────────┘           │
                       ▲             Next │  ▲ Prev          │
          (from any state on            ▼  │                │
           ConnectionLost)          ┌────────┐              │
                                    │ Scene2 │──────────────┤
                                    └────────┘              │
                                  Next │  ▲ Prev            │
                                       ▼  │                 │
                                   ┌────────┐               │
                                   │ Scene3 │───────────────┘
                                   └────────┘   NextScene wraps to Idle
```

Notes:
- `ConnectionLost` (WiFi or remote drops) sends the FSM to `Error` from any state.
- `Home` returns to `Idle` from any scene.
- `NextScene` on the last scene wraps back to `Idle`.

### Adding a scene

1. Add a `SceneN` value to the `State` enum in `Scenes.h`.
2. Extend `sceneIndex()` and `stateName()` in `Scenes.h`.
3. Add its `NextScene`/`PrevScene` edges in `StateMachine::decide()`.
4. Bump `SCENE_COUNT` in `config.h`.

## OSC address map

| Address | Args | When |
|---------|------|------|
| `/state` | string name, int sceneIndex | on every state change |
| `/scene` | int sceneIndex | on every state change (convenience) |
| `/wiimote/accel` | int x, int y, int z | ~30 Hz while in a scene |
| `/wiimote/buttons` | int bitmask | ~30 Hz while in a scene |

`sceneIndex`: `Idle = 0`, `Scene1 = 1`, …; non-scene states report `-1`.
