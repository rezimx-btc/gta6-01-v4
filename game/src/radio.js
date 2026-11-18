// VELMARA HEAT — the radio: three stations the player flips with 1, 2 and 3.
// WAVE 98 is Rio's own pirate talk station, Neon FM is synthwave, Tide AM is
// late jazz from the pier. Switching plays a station jingle and a DJ line; the
// lines rotate so the station always sounds alive.

import { RADIO } from './config.js';
import { pick } from './random.js';

const DJ_LINES = [
  'You are listening to WAVE 98, Velmara Bay, and the night is ours.',
  'Caller on line two says the cops are circling the marina. Thanks, caller.',
  'That was the sound of a getaway in D minor. Back after this.',
  'If you can hear my voice, you are already part of the broadcast.',
  'Traffic on Ocean Drive: one Comet, no brakes, no regrets.',
  'The lighthouse blinks twice for yes. It just blinked twice.',
  'This next song goes out to everyone running from a siren tonight.',
  'WAVE 98 — the only station the police cannot switch off.',
];

export class Radio {
  constructor(audio, rng) {
    this.audio = audio;
    this.rng = rng;
    this.station = 0;
    this.lineTimer = 14;
    this.currentLine = DJ_LINES[0];
  }

  name() {
    return RADIO.stations[this.station].name;
  }

  description() {
    return RADIO.stations[this.station].desc;
  }

  next() {
    this.station = (this.station + 1) % RADIO.stations.length;
    this.audio.jingle(this.station);
    this.currentLine = pick(this.rng, DJ_LINES);
    this.lineTimer = 16;
    return this.station;
  }

  setStation(i) {
    if (i === this.station) return;
    this.station = i % RADIO.stations.length;
    this.audio.jingle(this.station);
    this.currentLine = pick(this.rng, DJ_LINES);
    this.lineTimer = 16;
  }

  update(dt) {
    this.lineTimer -= dt;
    if (this.lineTimer <= 0) {
      this.currentLine = pick(this.rng, DJ_LINES);
      this.lineTimer = 18 + this.rng() * 10;
    }
  }

  line() {
    return this.currentLine;
  }
}
