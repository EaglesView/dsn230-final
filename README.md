# DSN230 Final — Wii Remote → ESP32 → TouchDesigner

An interactive installation. A **Wii remote** sends input over Bluetooth to an
**ESP32**, which runs a finite state machine and forwards state + live data to
**TouchDesigner** over OSC (WiFi/UDP). Each state is a *scene* with its own
visuals in TouchDesigner.

```
  Wii Remote  ──Bluetooth──▶  ESP32 (FSM)  ──OSC / WiFi UDP──▶  TouchDesigner
   buttons,                   decides the                       renders the
   accelerometer              current scene                     current scene
```

## Repository layout

| Path | What's in it |
|------|--------------|
| `firmware/esp32_controller/` | Arduino sketch for the ESP32 — the FSM, Wii input, and OSC output. |
| `touchdesigner/` | TouchDesigner project(s) and notes on the OSC mapping. |
| `hardware/` | Wiring, parts list, pinout. |
| `docs/` | Architecture notes and the state diagram. |

## Firmware quick start

1. Open `firmware/esp32_controller/esp32_controller.ino` in the Arduino IDE
   with the ESP32 board package installed.
2. Install the libraries (Library Manager):
   - **OSC** (CNMAT / Adrian Freed)
   - **ESP32Wiimote** (bigw00d)
3. Edit `config.h`: set your WiFi credentials and the IP/port of the computer
   running TouchDesigner.
4. Flash the ESP32. Open Serial Monitor at `115200` to watch state transitions.
5. Press **1 + 2** on the Wii remote to pair.

> Bench-testing without a Wii remote? Set `USE_WIIMOTE_LIB 0` in
> `WiimoteInput.h` to compile a stub that auto-"connects".

## The state machine

See [`docs/architecture.md`](docs/architecture.md) for the full state diagram.
Scenes are defined in `Scenes.h` and all transitions live in
`StateMachine::decide()` — one place to read or change the whole behavior.

| Wii button | Event | Effect |
|------------|-------|--------|
| A / + | `NextScene` | advance to the next scene (wraps at the last) |
| B / − | `PrevScene` | go to the previous scene |
| HOME | `Home` | return to `Idle` |
