// VELMARA HEAT — rendering: the three.js scene, the chase camera and the whole
// HUD. The camera rides behind the player (closer on foot, further in a car),
// the sun hangs low over the bay, and the minimap draws the city top-down with
// the player, the cops, the shops and the gold mission marker.

import * as THREE from 'three';
import { CITY } from './config.js';
import { clamp } from './random.js';

export class Renderer {
  constructor(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fc3e8);
    this.scene.fog = new THREE.Fog(0xcfe0ee, 180, 620);
    const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a6a4a, 1.7);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xffe0b0, 2.2);
    this.sun.position.set(180, 260, -120);
    this.scene.add(this.sun);
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 1400);
    this.camera.position.set(0, 12, 30);
    this.yaw = Math.PI;
    this.pitch = 0.32;
    this.minimap = minimapCanvas.getContext('2d');
    this.el = {
      cash: document.getElementById('cash'),
      listeners: document.getElementById('listeners'),
      clock: document.getElementById('clock'),
      wanted: document.getElementById('wanted'),
      objective: document.getElementById('objectiveText'),
      speed: document.getElementById('speedVal'),
      speedUnit: document.getElementById('speedUnit'),
      health: document.getElementById('healthfill'),
      radio: document.getElementById('radio'),
      toast: document.getElementById('toast'),
      hint: document.getElementById('hint'),
      screen: document.getElementById('screen'),
    };
    this.toastTimer = 0;
    this.clockMinutes = 18 * 60 + 42;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  toast(message) {
    this.el.toast.textContent = message;
    this.toastTimer = 3.5;
  }

  updateCamera(dt, player, input) {
    const mouse = input.consumeMouse();
    this.yaw -= mouse.dx * 0.0032;
    this.pitch = clamp(this.pitch + mouse.dy * 0.0022, 0.08, 0.85);
    const dist = player.onFoot ? 8.5 : 13;
    const height = player.onFoot ? 3.4 : 5.2;
    const backX = -Math.sin(this.yaw) * Math.cos(this.pitch);
    const backZ = -Math.cos(this.yaw) * Math.cos(this.pitch);
    const px = player.pos.x;
    const pz = player.pos.z;
    const tx = px + backX * dist;
    const tz = pz + backZ * dist;
    const ty = height + Math.sin(this.pitch) * dist * 0.6;
    this.camera.position.set(tx, ty, tz);
    this.camera.lookAt(px, 1.6, pz);
  }

  updateHUD(dt, world) {
    const player = world.player;
    const speedKmh = player.onFoot
      ? (player.speed > 0 ? (player.speed > 2 ? 12 : 5) : 0)
      : Math.round(Math.abs(player.speed) * 3.6);
    this.el.cash.textContent = '$' + player.cash.toLocaleString('en-US');
    this.el.listeners.textContent = 'WAVE 98 · ' + world.stream.formattedListeners() + ' listeners';
    this.clockMinutes += dt * 0.5;
    const hh = Math.floor(this.clockMinutes / 60) % 24;
    const mm = Math.floor(this.clockMinutes % 60);
    this.el.clock.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    let stars = '';
    for (let i = 0; i < 5; i += 1) {
      stars += i < world.police.wanted
        ? '<span class="lit">★</span>'
        : '<span class="dim">★</span>';
    }
    this.el.wanted.innerHTML = stars;
    this.el.objective.textContent = world.missions.objectiveText();
    this.el.speed.textContent = String(speedKmh);
    this.el.speedUnit.textContent = player.onFoot ? 'km/h on foot' : 'km/h';
    this.el.health.style.width = Math.max(0, player.health) + '%';
    this.el.radio.textContent = world.radio.name() + ' · ' + world.radio.line();
    this.drawMinimap(world);
    const shop = world.shops.nearest(player.pos);
    if (shop && player.onFoot) {
      this.el.hint.textContent = world.shops.promptFor(shop, player);
    } else {
      this.el.hint.textContent = 'WASD move · E steal car · F fight · 1/2/3 radio · P save';
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast.textContent = '';
    }
  }

  drawMinimap(world) {
    const g = this.minimap;
    const S = 180;
    const half = CITY.half + 70;
    const toPx = (v) => ((v + half) / (half * 2)) * S;
    g.clearRect(0, 0, S, S);
    g.fillStyle = '#0b1526';
    g.fillRect(0, 0, S, S);
    g.fillStyle = '#2a7ab5';
    g.fillRect(0, toPx(CITY.beachZ), S, S - toPx(CITY.beachZ));
    g.fillStyle = '#e0c184';
    g.fillRect(0, toPx(CITY.beachZ) - 3, S, 3);
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 1;
    const step = CITY.block + CITY.road;
    for (let i = 0; i <= CITY.blocks; i += 1) {
      const c = toPx(-CITY.half + i * step - CITY.road / 2);
      g.beginPath(); g.moveTo(c, 0); g.lineTo(c, S); g.stroke();
      g.beginPath(); g.moveTo(0, c); g.lineTo(S, c); g.stroke();
    }
    g.fillStyle = '#6a707c';
    for (const col of world.city.colliders) {
      g.fillRect(toPx(col.x - col.hw), toPx(col.z - col.hd), toPx(col.x + col.hw) - toPx(col.x - col.hw), toPx(col.z + col.hd) - toPx(col.z - col.hd));
    }
    g.fillStyle = '#37e6ff';
    for (const shop of world.city.places.shops) {
      g.fillRect(toPx(shop.x) - 2, toPx(shop.z) - 2, 4, 4);
    }
    const m = world.missions.current();
    if (m && !world.missions.done) {
      g.fillStyle = '#ffd166';
      g.beginPath();
      g.arc(toPx(m.target.x), toPx(m.target.z), 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#ff5a5a';
    for (const cop of world.police.cops) {
      g.beginPath();
      g.arc(toPx(cop.x), toPx(cop.z), 2.5, 0, Math.PI * 2);
      g.fill();
    }
    const p = world.player;
    const px = toPx(p.pos.x);
    const pz = toPx(p.pos.z);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(px, pz - 6);
    g.lineTo(px + 4.5, pz + 5);
    g.lineTo(px - 4.5, pz + 5);
    g.closePath();
    g.fill();
  }
}
