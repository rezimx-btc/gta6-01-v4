// VELMARA HEAT — the game: wires every system together, runs the loop, owns the
// state machine (title, play, pause) and the mission marker. ?shot=chase|drive|
// mission|heli stages a screenshot scene instead of the loop and sets
// window.__shotReady when the frame is painted.

import * as THREE from 'three';
import { mulberry32, hashSeed } from './random.js';
import { Input } from './input.js';
import { AudioSys } from './audio.js';
import { buildCity } from './city.js';
import { Traffic } from './traffic.js';
import { Player } from './player.js';
import { Police } from './police.js';
import { Helicopter } from './helicopter.js';
import { Combat } from './combat.js';
import { MissionManager } from './missions.js';
import { Radio } from './radio.js';
import { ShopSys } from './shops.js';
import { Stream } from './stream.js';
import { saveGame, loadGame } from './save.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;

export class Game {
  constructor() {
    const params = new URLSearchParams(window.location.search);
    const seedText = params.get('seed') || 'velmara-7';
    this.rng = mulberry32(hashSeed(seedText));
    this.canvas = document.getElementById('game');
    this.input = new Input(this.canvas);
    this.audio = new AudioSys();
    this.renderer = new Renderer(this.canvas, document.getElementById('minimap'));
    this.scene = this.renderer.scene;
    this.city = buildCity(this.scene, this.rng);
    this.traffic = new Traffic(this.scene, this.rng, this.city);
    this.player = new Player(this.scene);
    this.police = new Police(this.scene, this.rng);
    this.heli = new Helicopter(this.scene);
    this.combat = new Combat(this.audio);
    this.radio = new Radio(this.audio, this.rng);
    this.shops = new ShopSys(this);
    this.stream = new Stream(this.rng);
    this.missions = new MissionManager(this);
    this.state = 'title';
    this.time = 0;
    this.marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.6),
      new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0xcc9900, emissiveIntensity: 1.2 }),
    );
    this.markerBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.scene.add(this.marker);
    this.scene.add(this.markerBeam);
    const saved = loadGame();
    if (saved) this.missions.applySave(saved, this.player, this.stream);
    this.toast = (msg) => this.renderer.toast(msg);
    this.saveGame = () => saveGame(this);
    this.onBusted = () => {
      this.toast('BUSTED — the VPD took $150 and your afternoon.');
    };
    document.getElementById('playBtn').addEventListener('click', () => this.start());
    this.last = performance.now();
  }

  start() {
    this.audio.resume();
    this.audio.jingle(0);
    document.getElementById('screen').style.display = 'none';
    this.state = 'play';
    this.toast('Welcome to Velmara Bay. Follow the gold marker.');
  }

  step(dt) {
    const player = this.player;
    const input = this.input;
    if (input.wasPressed('KeyE')) this.pressE();
    if (input.wasPressed('Digit1')) this.radio.setStation(0);
    if (input.wasPressed('Digit2')) this.radio.setStation(1);
    if (input.wasPressed('Digit3')) this.radio.setStation(2);
    if (input.wasPressed('KeyP')) {
      if (this.saveGame()) this.toast('Game saved.');
    }
    if (input.wasPressed('Escape')) {
      this.state = this.state === 'play' ? 'pause' : 'play';
      this.toast(this.state === 'pause' ? 'Paused — Esc to resume.' : 'Back on the streets.');
    }
    this.player.update(dt, input, this.renderer.yaw, this);
    this.traffic.update(dt, player);
    this.police.update(dt, player, this);
    this.heli.setActive(this.police.wanted >= 3);
    this.heli.update(dt, player.pos);
    this.combat.update(dt, input, player, this);
    this.missions.update(dt, player);
    this.radio.update(dt);
    this.stream.update(dt, this);
    this.audio.setEngine(player.onFoot ? 0 : Math.abs(player.speed) / 38, !player.onFoot);
    this.audio.setSiren(this.police.wanted > 0 && this.police.cops.length > 0);
    const m = this.missions.current();
    if (m && !this.missions.done) {
      const bob = Math.sin(this.time * 2.4) * 0.8;
      this.marker.position.set(m.target.x, 8 + bob, m.target.z);
      this.marker.rotation.y += dt * 1.4;
      this.marker.visible = true;
      this.markerBeam.position.set(m.target.x, 30, m.target.z);
      this.markerBeam.visible = true;
    } else {
      this.marker.visible = false;
      this.markerBeam.visible = false;
    }
    this.renderer.updateCamera(dt, player, input);
    this.renderer.updateHUD(dt, this);
    input.endFrame();
  }

  pressE() {
    const player = this.player;
    const shop = this.shops.nearest(player.pos);
    if (shop && player.onFoot) {
      this.toast(this.shops.buy(shop, player));
      return;
    }
    if (player.onFoot) {
      const car = this.traffic.nearestCar(player.pos, 5);
      if (car) {
        this.traffic.stealCar(car);
        player.enterCar(car);
        this.police.addHeat(1);
        this.audio.blip();
        this.toast('Car stolen. That is one star, minimum.');
      }
    } else {
      player.exitCar();
    }
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || STEP);
    this.last = now;
    this.time += dt;
    if (this.state === 'play') this.step(dt);
    else if (this.state === 'title') {
      this.renderer.yaw += dt * 0.04;
      this.renderer.updateCamera(dt, this.player, this.input);
      this.renderer.updateHUD(dt, this);
      this.input.endFrame();
    }
    this.renderer.renderer.render(this.scene, this.renderer.camera);
    requestAnimationFrame((t) => this.frame(t));
  }

  run() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      stageShot(shot, this);
      this.renderer.renderer.render(this.scene, this.renderer.camera);
      this.renderer.renderer.render(this.scene, this.renderer.camera);
      window.__shotReady = true;
      return;
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  restart() {
    this.state = 'play';
    this.player.health = 100;
    this.player.pos.set(10, 0, 250);
    this.player.speed = 0;
    this.police.clearAll();
  }
}

const game = new Game();
game.run();
