# TouchDesigner

Place the `.toe` project file(s) in this folder.

## Receiving from the ESP32

The ESP32 sends OSC over UDP to the IP/port set in
`firmware/esp32_controller/config.h` (`TD_HOST` / `TD_OSC_PORT`, default
`7000`).

1. Add an **OSC In DAT** — set *Network Port* to match `TD_OSC_PORT`. This
   captures `/state` (name + index) for switching scenes.
2. Add an **OSC In CHOP** on the same port for the numeric streams
   (`/wiimote/accel`, `/wiimote/buttons`) you want to drive parameters with.
3. Use the scene index from `/scene` (or `/state`) to switch between your scene
   containers — e.g. a **Switch TOP/COP** indexed by the incoming value.

See [`../docs/architecture.md`](../docs/architecture.md) for the full OSC
address map.
