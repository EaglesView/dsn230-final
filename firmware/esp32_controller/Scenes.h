// Scenes.h — the vocabulary of the finite state machine.
//
// A "state" is one screen/behavior of the installation. Boot, Connecting,
// Idle and Error are lifecycle states; Scene1..SceneN are the interactive
// scenes the Wii remote cycles through, each driving different TouchDesigner
// visuals.
//
// An "event" is something that can cause a transition: a Wii remote button,
// or an internal signal (connected, connection lost, boot finished).

#pragma once

#include <Arduino.h>

// ---- States ----------------------------------------------------------------
enum class State : uint8_t {
  Boot,        // power-on: bring up peripherals
  Connecting,  // joining WiFi and pairing the Wii remote
  Idle,        // attract / resting mode, waiting for interaction
  Scene1,      // first interactive scene
  Scene2,      // second interactive scene
  Scene3,      // third interactive scene
  Error,       // something failed; TouchDesigner shows a fault screen
};

// ---- Events -----------------------------------------------------------------
enum class Event : uint8_t {
  None,          // no input this tick
  BootDone,      // peripherals initialized
  Connected,     // WiFi up and Wii remote paired
  ConnectionLost,// WiFi or Wii remote dropped
  NextScene,     // Wii "A" / "+"  -> advance scene
  PrevScene,     // Wii "B" / "-"  -> previous scene
  Home,          // Wii "HOME"     -> return to Idle
};

// Map a Scene state to its 1-based scene index (Idle = 0). Returns -1 for
// non-scene states. Used in the OSC payload so TouchDesigner knows which
// scene to render.
inline int sceneIndex(State s) {
  switch (s) {
    case State::Idle:   return 0;
    case State::Scene1: return 1;
    case State::Scene2: return 2;
    case State::Scene3: return 3;
    default:            return -1;
  }
}

// Human-readable name for logging and for the OSC /state message.
inline const char* stateName(State s) {
  switch (s) {
    case State::Boot:       return "Boot";
    case State::Connecting: return "Connecting";
    case State::Idle:       return "Idle";
    case State::Scene1:     return "Scene1";
    case State::Scene2:     return "Scene2";
    case State::Scene3:     return "Scene3";
    case State::Error:      return "Error";
  }
  return "Unknown";
}
