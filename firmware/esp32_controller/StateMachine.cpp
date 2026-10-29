#include "StateMachine.h"

#include "OscSender.h"
#include "config.h"

StateMachine::StateMachine(OscSender& osc) : osc_(osc) {}

void StateMachine::begin() {
  current_ = State::Boot;
  previous_ = State::Boot;
  enteredAt_ = millis();
  onEnter(current_);
}

unsigned long StateMachine::timeInState() const {
  return millis() - enteredAt_;
}

// --- Pure transition table --------------------------------------------------
// The whole behavior of the installation lives here. To add a scene, add a
// State in Scenes.h and wire its NextScene/PrevScene edges below.
State StateMachine::decide(State current, Event event) const {
  // A lost connection always wins, from any state.
  if (event == Event::ConnectionLost) return State::Error;

  // HOME returns to Idle, but only from Idle or an interactive scene
  // (sceneIndex >= 0). You can't HOME out of Boot/Connecting/Error — those
  // only leave on their own signals.
  if (event == Event::Home && sceneIndex(current) >= 0) {
    return State::Idle;
  }

  switch (current) {
    case State::Boot:
      if (event == Event::BootDone) return State::Connecting;
      break;

    case State::Connecting:
      if (event == Event::Connected) return State::Idle;
      break;

    case State::Idle:
      if (event == Event::NextScene) return State::Scene1;
      break;

    case State::Scene1:
      if (event == Event::NextScene) return State::Scene2;
      if (event == Event::PrevScene) return State::Idle;
      break;

    case State::Scene2:
      if (event == Event::NextScene) return State::Scene3;
      if (event == Event::PrevScene) return State::Scene1;
      break;

    case State::Scene3:
      if (event == Event::NextScene) return State::Idle;  // wrap around
      if (event == Event::PrevScene) return State::Scene2;
      break;

    case State::Error:
      if (event == Event::Connected) return State::Connecting;
      break;
  }

  return current;  // no transition
}

void StateMachine::update(Event event) {
  State next = decide(current_, event);

  if (next != current_) {
    onExit(current_);
    previous_ = current_;
    current_ = next;
    enteredAt_ = millis();
    onEnter(current_);
  }

  onUpdate(current_);
}

// --- Side effects on state boundaries ---------------------------------------
void StateMachine::onEnter(State to) {
  Serial.printf("[FSM] -> %s\n", stateName(to));

  // Tell TouchDesigner the state changed. /state carries the name;
  // /scene carries the numeric scene index (-1 for non-scene states).
  osc_.sendState(stateName(to), sceneIndex(to));
  lastStream_ = 0;  // force an immediate live-data send on the next tick
}

void StateMachine::onExit(State from) {
  Serial.printf("[FSM] leaving %s (after %lu ms)\n",
                stateName(from), timeInState());
}

// --- Per-tick behavior ------------------------------------------------------
void StateMachine::onUpdate(State s) {
  // Only interactive scenes stream live Wii remote data to TouchDesigner,
  // rate-limited so we don't flood the network.
  if (sceneIndex(s) < 1) return;

  unsigned long now = millis();
  if (now - lastStream_ >= SCENE_SEND_INTERVAL_MS) {
    lastStream_ = now;
    osc_.streamWiimote();
  }
}
