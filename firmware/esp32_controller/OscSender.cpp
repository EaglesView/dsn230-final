#include "OscSender.h"

#include <OSCMessage.h>

#include "config.h"

OscSender::OscSender(WiimoteInput& wii) : wii_(wii) {}

void OscSender::begin() {
  udp_.begin(TD_OSC_PORT);  // local bind; we only send, but this is harmless
}

static void dispatch(WiFiUDP& udp, OSCMessage& msg) {
  udp.beginPacket(TD_HOST, TD_OSC_PORT);
  msg.send(udp);
  udp.endPacket();
  msg.empty();
}

void OscSender::sendState(const char* name, int sceneIndex) {
  OSCMessage state("/state");
  state.add(name).add((int32_t)sceneIndex);
  dispatch(udp_, state);

  OSCMessage scene("/scene");
  scene.add((int32_t)sceneIndex);
  dispatch(udp_, scene);
}

void OscSender::streamWiimote() {
  const WiimoteData& d = wii_.data();

  OSCMessage accel("/wiimote/accel");
  accel.add((int32_t)d.accelX)
       .add((int32_t)d.accelY)
       .add((int32_t)d.accelZ);
  dispatch(udp_, accel);

  OSCMessage buttons("/wiimote/buttons");
  buttons.add((int32_t)d.buttons);
  dispatch(udp_, buttons);
}
