// VELMARA HEAT — the police helicopter: joins the chase at 3 stars, circles the
// player from above and sweeps a spotlight over him. It never lands; it is the
// eye in the sky that keeps the heat on while the player tries to break line of
// sight in the alleys.

import * as THREE from 'three';
import { SPEED } from './config.js';

export class Helicopter {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.angle = 0;
    this.group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.4, 6.2),
      new THREE.MeshLambertMaterial({ color: 0x1c2733 }),
    );
    body.position.y = 0;
    this.group.add(body);
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 4.4),
      new THREE.MeshLambertMaterial({ color: 0x1c2733 }),
    );
    tail.position.set(0, 0.3, -5);
    this.group.add(tail);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.9, 1.6),
      new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x223344, emissiveIntensity: 0.5 }),
    );
    glass.position.set(0, 0.3, 2.6);
    this.group.add(glass);
    this.rotor = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.08, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x111111 }),
    );
    this.rotor.position.y = 1.0;
    this.group.add(this.rotor);
    const beamGeo = new THREE.ConeGeometry(7, 55, 20, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff2b0, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false,
    });
    this.beam = new THREE.Mesh(beamGeo, beamMat);
    this.beam.position.y = -27;
    this.beam.rotation.x = Math.PI;
    this.group.add(this.beam);
    this.light = new THREE.SpotLight(0xfff2b0, 60, 90, 0.32, 0.5, 1.2);
    this.group.add(this.light);
    this.group.visible = false;
    scene.add(this.group);
  }

  setActive(on) {
    this.active = on;
    this.group.visible = on;
  }

  update(dt, playerPos) {
    if (!this.active) return;
    this.angle += (SPEED.heliCruise / 42) * dt;
    const x = playerPos.x + Math.cos(this.angle) * 42;
    const z = playerPos.z + Math.sin(this.angle) * 42;
    const y = 52 + Math.sin(this.angle * 2.3) * 3;
    this.group.position.set(x, y, z);
    this.group.rotation.y = Math.atan2(playerPos.x - x, playerPos.z - z);
    this.rotor.rotation.y += dt * 22;
    this.light.target.position.set(playerPos.x, 0, playerPos.z);
    this.light.target.updateMatrixWorld();
  }

  dispose() {
    this.setActive(false);
  }
}
