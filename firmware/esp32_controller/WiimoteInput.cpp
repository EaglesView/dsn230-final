#include "WiimoteInput.h"

#if USE_WIIMOTE_LIB
#include <ESP32Wiimote.h>
static ESP32Wiimote wiimote;
#endif

void WiimoteInput::begin() {
#if USE_WIIMOTE_LIB
  wiimote.init();
  Serial.println("[Wii] waiting for Wii remote (press 1+2 to pair)...");
#else
  Serial.println("[Wii] stub mode: no Wii remote library compiled in");
#endif
}

// Returns a single button-edge event per call, debounced. Live analog data
// (accelerometer) is kept in data_ for OscSender to stream.
Event WiimoteInput::poll() {
#if USE_WIIMOTE_LIB
  wiimote.task();

  if (wiimote.available() == 0) {
    // No fresh packet. Connection state is tracked via isConnected-style
    // reads; if the library reports no link, surface it.
    return Event::None;
  }

  bool wasConnected = data_.connected;
  data_.connected = true;

  uint16_t buttons = wiimote.getButtonState();
  ButtonState bs = buttons;  // ESP32Wiimote typedef
  data_.buttons = buttons;

  AccelState accel = wiimote.getAccelState();
  data_.accelX = accel.xAxis;
  data_.accelY = accel.yAxis;
  data_.accelZ = accel.zAxis;

  // Signal the FSM the first time we see a connected remote.
  if (!wasConnected) return Event::Connected;

  // Debounced rising-edge detection: fire once when a button goes down.
  unsigned long now = millis();
  uint16_t pressed = buttons & ~lastButtons_;  // newly-pressed bits
  lastButtons_ = buttons;

  if (pressed && (now - lastEventAt_) >= DEBOUNCE_MS) {
    lastEventAt_ = now;
    if (pressed & BUTTON_A || pressed & BUTTON_PLUS)  return Event::NextScene;
    if (pressed & BUTTON_B || pressed & BUTTON_MINUS) return Event::PrevScene;
    if (pressed & BUTTON_HOME)                        return Event::Home;
  }
  return Event::None;

#else
  // Stub: pretend a remote connected once, then stay quiet. Lets you exercise
  // the FSM without hardware. Drive transitions manually over Serial if you
  // like (see esp32_controller.ino).
  if (!data_.connected) {
    data_.connected = true;
    return Event::Connected;
  }
  return Event::None;
#endif
}
