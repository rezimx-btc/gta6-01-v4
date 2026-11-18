// VELMARA HEAT — combat: fists when unarmed, a pistol once the player buys one
// at Ironworks Arms. F is one swing or shot per press with a short cooldown.
// Hitting a pedestrian scares them off and draws heat; hitting a cop draws more.

import { clamp } from './random.js';

export class Combat {
  constructor(audio) {
    this.audio = audio;
    this.cooldown = 0;
    this.shotsFired = 0;
    this.kos = 0;
  }

  update(dt, input, player, world) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (!input.wasPressed('KeyF') || this.cooldown > 0) return;
    this.cooldown = 0.45;
    const range = player.hasWeapon ? 30 : 2.4;
    const facingX = Math.sin(player.heading);
    const facingZ = Math.cos(player.heading);
    if (player.hasWeapon) {
      this.audio.tone(220, 0.1, 'square', 0.2);
      this.audio.noise(0.08, 0.25, 1800);
      this.shotsFired += 1;
    } else {
      this.audio.punch();
    }
    let best = null;
    let bestScore = Infinity;
    const consider = (x, z, obj) => {
      const dx = x - player.pos.x;
      const dz = z - player.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > range) return;
      const dot = (dx * facingX + dz * facingZ) / (d || 1);
      if (dot < 0.5) return;
      const score = d + (1 - dot) * 4;
      if (score < bestScore) {
        bestScore = score;
        best = obj;
      }
    };
    for (const ped of world.traffic.peds) consider(ped.x, ped.z, { kind: 'ped', ref: ped });
    for (const cop of world.police.cops) consider(cop.x, cop.z, { kind: 'cop', ref: cop });
    if (!best) return;
    if (best.kind === 'ped') {
      best.ref.flee = 6;
      best.ref.tx = best.ref.x + (best.ref.x - player.pos.x) * 4;
      best.ref.tz = best.ref.z + (best.ref.z - player.pos.z) * 4;
      world.police.addHeat(1);
      if (world.toast) world.toast('A pedestrian ran off screaming. The city noticed.');
    } else {
      world.police.addHeat(1);
      this.kos += 1;
      if (world.toast) world.toast('You dropped a cop. Every unit in Velmara is coming.');
    }
  }

  nearestPed(player, maxDist) {
    let best = null;
    let bestDist = maxDist;
    for (const ped of this.world?.traffic?.peds ?? []) {
      const d = Math.hypot(ped.x - player.pos.x, ped.z - player.pos.z);
      if (d < bestDist) {
        bestDist = d;
        best = ped;
      }
    }
    return best;
  }
}
