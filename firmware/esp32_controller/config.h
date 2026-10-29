// config.h — project-wide configuration for the ESP32 controller.
//
// Fill in your WiFi credentials and the IP/port of the machine running
// TouchDesigner. TouchDesigner listens for OSC on an "OSC In" CHOP/DAT.
//
// NOTE: these are committed with placeholder values so the sketch compiles.
// Replace them with your real values before flashing.

#pragma once

// ---- WiFi ------------------------------------------------------------------
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// ---- TouchDesigner OSC target ---------------------------------------------
// The IP of the computer running TouchDesigner and the port its
// "OSC In" CHOP/DAT is bound to.
#define TD_HOST "192.168.1.100"
#define TD_OSC_PORT 7000

// ---- Timing (milliseconds) -------------------------------------------------
#define CONNECT_TIMEOUT_MS 15000  // give up a connection attempt after this
#define SCENE_SEND_INTERVAL_MS 33 // ~30 Hz stream of live Wii data per scene
#define DEBOUNCE_MS 180           // ignore repeated button presses within this

// ---- Scenes ----------------------------------------------------------------
// Number of interactive scenes the Wii remote cycles through (not counting
// Boot / Connecting / Idle / Error). Bump this and add cases in Scenes.h.
#define SCENE_COUNT 3
