// WiimoteInput.h — reads the Wii remote and turns it into FSM events + data.
//
// The ESP32 pairs with the Wii remote over Bluetooth Classic. This wraps the
// ESP32Wiimote library (https://github.com/bigw00d/Arduino-ESP32Wiimote):
//   Arduino IDE -> Library Manager -> "ESP32Wiimote".
//
// If you don't have the library yet, the code still compiles as a stub when
// USE_WIIMOTE_LIB is 0 below — handy for testing the FSM on the bench.

#pragma once

#include "Scenes.h"
#include "config.h"

#define USE_WIIMOTE_LIB 1  // set to 0 to build without the library (stub input)

struct WiimoteData {
  int accelX = 0, accelY = 0, accelZ = 0;  // raw accelerometer
  uint16_t buttons = 0;                     // bitmask of held buttons
  bool connected = false;
};

class WiimoteInput {
 public:
  void begin();

  // Call every loop(). Updates internal data and returns at most one
  // discrete Event (button edge) per call; Event::None if nothing happened.
  Event poll();

  const WiimoteData& data() const { return data_; }
  bool connected() const { return data_.connected; }

 private:
  WiimoteData data_;
  uint16_t lastButtons_ = 0;         // for edge detection
  unsigned long lastEventAt_ = 0;    // for debounce
};
