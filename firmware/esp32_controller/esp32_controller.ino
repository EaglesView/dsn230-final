// esp32_controller.ino — DSN230 final: ESP32 + Wii remote -> TouchDesigner.
//
// Flow of control:
//   Wii remote --(Bluetooth)--> ESP32 --(OSC over WiFi/UDP)--> TouchDesigner
//
// The ESP32 runs a finite state machine (see StateMachine.* and Scenes.h).
// The Wii remote produces events (button edges) and live data (accelerometer);
// the FSM turns events into state changes and streams data to TouchDesigner.
//
// Each loop() tick: read input -> feed the FSM one event -> FSM acts.

#include <WiFi.h>

#include "OscSender.h"
#include "StateMachine.h"
#include "WiimoteInput.h"
#include "config.h"

WiimoteInput wii;
OscSender osc(wii);
StateMachine fsm(osc);

static bool wifiConnected = false;

static void startWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WiFi] connecting to %s", WIFI_SSID);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n[boot] DSN230 ESP32 controller starting");

  startWifi();
  wii.begin();
  osc.begin();
  fsm.begin();  // enters Boot
}

void loop() {
  // 1) Keep connection status current and translate it into FSM events.
  Event event = Event::None;

  bool nowWifi = (WiFi.status() == WL_CONNECTED);
  if (nowWifi && !wifiConnected) {
    wifiConnected = true;
    Serial.printf("\n[WiFi] connected, IP %s\n", WiFi.localIP().toString().c_str());
  } else if (!nowWifi && wifiConnected) {
    wifiConnected = false;
    event = Event::ConnectionLost;
  }

  // 2) Poll the Wii remote (button edge or Connected/None).
  Event wiiEvent = wii.poll();

  // The system is "Connected" only when BOTH WiFi and the remote are up.
  if (wiiEvent == Event::Connected && !wifiConnected) {
    wiiEvent = Event::None;  // remote up but WiFi not yet; keep waiting
  }

  // Move Boot -> Connecting once peripherals are initialized.
  if (fsm.state() == State::Boot) {
    event = Event::BootDone;
  } else if (event == Event::None) {
    event = wiiEvent;  // connection events take priority over button edges
  }

  // 3) Advance the state machine.
  fsm.update(event);
}
