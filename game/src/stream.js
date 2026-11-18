// VELMARA HEAT — the live broadcast: WAVE 98's listener count is the game's
// second currency. Missions push it up, callers phone in while you drive, and
// the station's patter tracks how hot the city thinks you are. On air, the
// count drifts upward on its own; off the story path it stalls.

import { pick } from './random.js';

const CALLERS = [
  'Caller: "Rio, I saw the Comet on Ocean Drive — that was you, right?"',
  'Caller: "Long-time listener, first-time getaway driver."',
  'Caller: "Play something fast, the cops are right behind me."',
  'Caller: "My grandma listens to WAVE 98. She says hi, Rio."',
  'Caller: "The lighthouse blinked twice again. What does it mean?"',
  'Caller: "I heard the vault truck on the pier. Legendary."',
  'Caller: "Requesting static. Just static. The good kind."',
  'Caller: "Tell the marina tower I said thanks for the signal."',
];

export class Stream {
  constructor(rng) {
    this.rng = rng;
    this.listeners = 1204;
    this.onAir = true;
    this.callTimer = 9;
    this.currentCaller = CALLERS[0];
    this.drift = 0;
  }

  addListeners(n) {
    this.listeners += n;
  }

  update(dt, world) {
    this.drift += dt;
    if (this.onAir && this.drift > 1) {
      this.drift = 0;
      this.listeners += 1 + Math.floor(this.rng() * 3);
    }
    this.callTimer -= dt;
    if (this.callTimer <= 0) {
      this.callTimer = 22 + this.rng() * 18;
      this.currentCaller = pick(this.rng, CALLERS);
      if (world.toast) world.toast(this.currentCaller);
    }
  }

  formattedListeners() {
    return this.listeners.toLocaleString('en-US');
  }
}
