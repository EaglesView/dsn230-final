// OscSender.h — sends the installation's state and live data to TouchDesigner.
//
// Uses the CNMAT OSC library over UDP:
//   Arduino IDE -> Library Manager -> "OSC" by Adrian Freed / Yotam Mann.
//
// OSC address map (receive these in TouchDesigner with an "OSC In DAT/CHOP"):
//   /state   (string name, int sceneIndex)   -> on every state change
//   /scene   (int sceneIndex)                -> convenience, same change
//   /wiimote/accel  (int x, int y, int z)    -> ~30 Hz while in a scene
//   /wiimote/buttons (int bitmask)           -> ~30 Hz while in a scene

#pragma once

#include <WiFiUdp.h>

#include "WiimoteInput.h"

class OscSender {
 public:
  // Needs the Wii input so it can stream live data on demand.
  explicit OscSender(WiimoteInput& wii);

  void begin();  // opens the UDP socket

  // Called by the FSM when the state changes.
  void sendState(const char* name, int sceneIndex);

  // Called by the FSM each tick while parked in an interactive scene.
  void streamWiimote();

 private:
  WiFiUDP udp_;
  WiimoteInput& wii_;
};
