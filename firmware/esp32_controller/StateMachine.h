// StateMachine.h — the finite state machine that drives the installation.
//
// Design: transition logic is kept pure in `decide()` (given the current
// state and an event, return the next state). Side effects — telling
// TouchDesigner what changed — happen in onEnter()/onExit() only when the
// state actually changes. This keeps the "what should happen" and the
// "what to do about it" cleanly separated and easy to reason about.

#pragma once

#include "Scenes.h"

class OscSender;  // forward-declared; see OscSender.h

class StateMachine {
 public:
  explicit StateMachine(OscSender& osc);

  // Call once before loop().
  void begin();

  // Feed one event per tick (Event::None when nothing happened).
  // Applies any transition and runs the current state's per-tick behavior.
  void update(Event event);

  State state() const { return current_; }
  State previous() const { return previous_; }

  // Milliseconds spent in the current state.
  unsigned long timeInState() const;

 private:
  // Pure transition table: current + event -> next state.
  State decide(State current, Event event) const;

  // Side effects on crossing a state boundary.
  void onExit(State from);
  void onEnter(State to);

  // Per-tick behavior while parked in a state (e.g. stream live Wii data).
  void onUpdate(State s);

  OscSender& osc_;
  State current_ = State::Boot;
  State previous_ = State::Boot;
  unsigned long enteredAt_ = 0;   // millis() when current_ was entered
  unsigned long lastStream_ = 0;  // millis() of last live data send
};
