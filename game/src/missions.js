// VELMARA HEAT — missions: 8 story jobs across 3 acts, each a drive-to target
// with a briefing, a gold marker and a payout in cash and radio listeners. The
// manager watches the player's position, pays out on arrival, and advances the
// story; the final mission ends at the lighthouse with the last broadcast.

import { ECONOMY } from './config.js';

export const MISSIONS = [
  {
    act: 0, title: 'Static',
    briefing: 'Steal a car and get to the studio before the first broadcast.',
    target: { x: 0, z: 200 }, radius: 10, pay: 400, listeners: 900,
  },
  {
    act: 0, title: 'Dead Air',
    briefing: 'Lose the 2-star tail through Market Row. Break line of sight.',
    target: { x: 120, z: 60 }, radius: 12, pay: 650, listeners: 1400,
  },
  {
    act: 0, title: 'Signal Boost',
    briefing: 'Plant the transmitter on the Marina Tower roof. Drive to the tower.',
    target: { x: -180, z: -40 }, radius: 12, pay: 900, listeners: 2200,
  },
  {
    act: 1, title: 'Callers',
    briefing: 'Pick up three callers across the city while the cops listen in.',
    target: { x: -60, z: -180 }, radius: 12, pay: 1100, listeners: 3600,
  },
  {
    act: 1, title: 'Prime Time',
    briefing: 'The broadcast heist: drive the vault truck to the pier. Do not stop.',
    target: { x: 0, z: 306 }, radius: 14, pay: 2500, listeners: 8000,
  },
  {
    act: 1, title: 'Feedback',
    briefing: 'Escape the 4-star dragnet after the heist went loud. Reach Old Velmara.',
    target: { x: -60, z: -180 }, radius: 12, pay: 1400, listeners: 4200,
  },
  {
    act: 2, title: 'Dead Frequency',
    briefing: 'Silence the rival station jammer van on Ocean Drive.',
    target: { x: 60, z: 250 }, radius: 12, pay: 1600, listeners: 6000,
  },
  {
    act: 2, title: 'Sign Off',
    briefing: 'One last broadcast from the lighthouse. Drive the coast road.',
    target: { x: 230, z: -230 }, radius: 14, pay: 4000, listeners: 15000,
  },
];

export class MissionManager {
  constructor(world) {
    this.world = world;
    this.index = 0;
    this.done = false;
    this.completedCount = 0;
  }

  current() {
    return MISSIONS[this.index] || null;
  }

  objectiveText() {
    if (this.done) return 'All missions complete — Velmara is yours. Free roam!';
    const m = this.current();
    return m ? m.title + ' — ' + m.briefing : '';
  }

  update(dt, player) {
    if (this.done) return;
    const m = this.current();
    if (!m) {
      this.done = true;
      return;
    }
    // Mission 2 starts with heat already on the player.
    if (this.index === 1 && this.world.police.wanted < 2) this.world.police.addHeat(2);
    if (this.index === 5 && this.world.police.wanted < 4) this.world.police.addHeat(4);
    const d = Math.hypot(player.pos.x - m.target.x, player.pos.z - m.target.z);
    if (d < m.radius) this.complete(m, player);
  }

  complete(m, player) {
    const pay = ECONOMY.missionPay[this.index] ?? m.pay;
    player.cash += pay;
    this.world.stream.addListeners(m.listeners);
    this.completedCount += 1;
    this.world.audio.cash();
    if (this.world.toast) {
      this.world.toast(m.title + ' complete! +$' + pay + ' and +' + m.listeners.toLocaleString() + ' listeners.');
    }
    this.index += 1;
    if (this.index >= MISSIONS.length) {
      this.done = true;
      if (this.world.toast) this.world.toast('SIGN OFF — you own the night, Rio.');
    }
    if (this.world.saveGame) this.world.saveGame();
  }

  applySave(data, player, stream) {
    if (!data) return;
    player.cash = data.cash;
    player.hasWeapon = !!data.hasWeapon;
    player.clothes = data.clothes || 0;
    player.modLevel = data.modLevel || 0;
    player.health = data.health ?? 100;
    this.index = data.missionIndex || 0;
    this.completedCount = data.completedCount || 0;
    this.done = !!data.done;
    stream.listeners = data.listeners || 1204;
  }
}
