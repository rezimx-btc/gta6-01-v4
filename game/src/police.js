// VELMARA HEAT — the police: a wanted level from 0 to 5 stars. Causing trouble
// raises heat; hiding from every cop for a while cools one star at a time. Cop
// cars spawn at the city edge, chase the player and try to ram him to a stop;
// if they pin him while he is slow, the bust meter fills and he is busted.

import * as THREE from 'three';
import { CITY, WANTED, SPEED } from './config.js';
import { clamp, range } from './random.js';
import { makeCarMesh } from './traffic.js';

export class Police {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.wanted = 0;
    this.coolTimer = 0;
    this.bust = 0;
    this.cops = [];
    this.spawnTimer = 0;
  }

  addHeat(n) {
    this.wanted = clamp(this.wanted + n, 0, 5);
    this.coolTimer = 0;
  }

  spawnCop(playerPos) {
    const angle = this.rng() * Math.PI * 2;
    const dist = 90 + this.rng() * 40;
    const x = clamp(playerPos.x + Math.cos(angle) * dist, -CITY.half, CITY.half);
    const z = clamp(playerPos.z + Math.sin(angle) * dist, -CITY.half, CITY.half);
    const mesh = makeCarMesh(0x1c2733, true);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
    const cop = { mesh, x, z, heading: 0, speed: 0 };
    this.cops.push(cop);
    return cop;
  }

  removeCop(cop) {
    this.scene.remove(cop.mesh);
    const i = this.cops.indexOf(cop);
    if (i >= 0) this.cops.splice(i, 1);
  }

  update(dt, player, world) {
    const want = this.wanted >= WANTED.copAt ? Math.min(this.wanted, WANTED.maxCops) : 0;
    this.spawnTimer -= dt;
    if (this.cops.length < want && this.spawnTimer <= 0) {
      this.spawnCop(player.pos);
      this.spawnTimer = 2.5;
    }
    while (this.cops.length > want) this.removeCop(this.cops[this.cops.length - 1]);
    let seen = false;
    for (const cop of this.cops) {
      const dx = player.pos.x - cop.x;
      const dz = player.pos.z - cop.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 120) seen = true;
      const targetHeading = Math.atan2(dx, dz);
      let diff = targetHeading - cop.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      cop.heading += clamp(diff, -2.4 * dt, 2.4 * dt);
      const targetSpeed = this.wanted >= 3 ? 30 : 24;
      cop.speed += (targetSpeed - cop.speed) * Math.min(1, dt * 0.8);
      const nx = cop.x + Math.sin(cop.heading) * cop.speed * dt;
      const nz = cop.z + Math.cos(cop.heading) * cop.speed * dt;
      if (!world.city || !player.hitsBuilding(nx, nz, world.city.colliders)) {
        cop.x = nx;
        cop.z = nz;
      } else {
        cop.speed *= 0.6;
      }
      cop.mesh.position.set(cop.x, 0, cop.z);
      cop.mesh.rotation.y = cop.heading;
      const bar = cop.mesh.getObjectByName('lightbar');
      if (bar) bar.material.emissive.setHex(Math.floor(performance.now() / 260) % 2 === 0 ? 0xff2222 : 0x2244ff);
      if (dist < 4.5 && Math.abs(player.speed) < 3) {
        this.bust += dt / 3.2;
        if (this.bust >= 1) {
          this.bust = 0;
          this.wanted = 0;
          player.cash = Math.max(0, player.cash - 150);
          player.health = 100;
          player.pos.set(10, 0, 250);
          player.speed = 0;
          if (world.onBusted) world.onBusted();
        }
      }
    }
    if (!seen && this.wanted > 0) {
      this.coolTimer += dt;
      if (this.coolTimer > WANTED.decaySeconds) {
        this.wanted -= 1;
        this.coolTimer = 0;
      }
    } else {
      this.coolTimer = 0;
    }
    if (this.cops.length === 0) this.bust = Math.max(0, this.bust - dt / 2);
  }

  clearAll() {
    while (this.cops.length > 0) this.removeCop(this.cops[0]);
    this.wanted = 0;
    this.bust = 0;
  }
}
