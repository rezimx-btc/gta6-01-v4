// VELMARA HEAT — the player: Rio Vega on foot and behind the wheel. On foot he
// walks at exactly 5 km/h (the HUD speed is honest) and sprints at 3.4 m/s; in a
// car he accelerates, brakes and steers with a simple arcade model. Collisions
// against buildings are soft: the player slides along walls instead of stopping
// dead, and a car bumps to a stop with a speed penalty instead of a hard wall.

import * as THREE from 'three';
import { CITY, SPEED } from './config.js';
import { clamp } from './random.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.pos = new THREE.Vector3(10, 0, 250);
    this.heading = Math.PI;
    this.speed = 0;
    this.onFoot = true;
    this.car = null;
    this.health = 100;
    this.cash = 250;
    this.hasWeapon = false;
    this.clothes = 0;
    this.modLevel = 0;
    this.standing = true;
    this.group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.0, 0.36),
      new THREE.MeshLambertMaterial({ color: 0xff5a7a }),
    );
    body.position.y = 1.0;
    this.group.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xe8b88a }),
    );
    head.position.y = 1.72;
    this.group.add(head);
    const legs = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.5, 0.32),
      new THREE.MeshLambertMaterial({ color: 0x22304a }),
    );
    legs.position.y = 0.25;
    this.group.add(legs);
    this.group.position.copy(this.pos);
    scene.add(this.group);
  }

  moveAxis(dx, dz, distance, colliders) {
    // Move one axis at a time so the player slides along walls (soft collision).
    const tryX = this.pos.x + dx * distance;
    if (!this.hitsBuilding(tryX, this.pos.z, colliders)) this.pos.x = tryX;
    const tryZ = this.pos.z + dz * distance;
    if (!this.hitsBuilding(this.pos.x, tryZ, colliders)) this.pos.z = tryZ;
  }

  hitsBuilding(x, z, colliders) {
    for (let i = 0; i < colliders.length; i += 1) {
      const c = colliders[i];
      if (Math.abs(x - c.x) < c.hw + 0.4 && Math.abs(z - c.z) < c.hd + 0.4) return true;
    }
    return false;
  }

  update(dt, input, yaw, world) {
    const axis = input.axis();
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const fwdX = -sin;
    const fwdZ = -cos;
    const rightX = cos;
    const rightZ = -sin;
    if (this.onFoot) {
      const target = input.sprinting() ? SPEED.sprint : SPEED.walk;
      const moving = axis.x !== 0 || axis.z !== 0;
      const mx = (fwdX * -axis.z + rightX * axis.x) || 0;
      const mz = (fwdZ * -axis.z + rightZ * axis.x) || 0;
      const len = Math.hypot(mx, mz) || 1;
      const step = (moving ? target : 0) * dt;
      this.moveAxis(mx / len, mz / len, step, world.city.colliders);
      if (moving) this.heading = Math.atan2(mx, mz);
      this.speed = moving ? target : 0;
      this.group.visible = true;
      this.group.position.set(this.pos.x, 0, this.pos.z);
      this.group.rotation.y = this.heading;
    } else if (this.car) {
      const car = this.car;
      const accel = -axis.z;
      const steer = axis.x;
      if (accel > 0) this.speed += SPEED.carAccel * (1 + this.modLevel * 0.12) * dt;
      else if (accel < 0) {
        if (this.speed > 0.5) this.speed -= SPEED.carBrake * dt;
        else this.speed -= SPEED.carReverse * dt;
      } else {
        this.speed -= Math.sign(this.speed) * 6 * dt;
        if (Math.abs(this.speed) < 0.2) this.speed = 0;
      }
      this.speed = clamp(this.speed, -SPEED.carReverse, SPEED.carMax * (1 + this.modLevel * 0.1));
      this.heading += steer * SPEED.carTurn * dt * clamp(Math.abs(this.speed) / 8, 0, 1) * (this.speed >= 0 ? 1 : -1);
      const nx = this.pos.x + Math.sin(this.heading) * this.speed * dt;
      const nz = this.pos.z + Math.cos(this.heading) * this.speed * dt;
      if (this.hitsBuilding(nx, nz, world.city.colliders)) {
        // Soft bump: keep most of the speed, slide off the wall.
        this.speed *= 0.55;
      } else {
        this.pos.x = nx;
        this.pos.z = nz;
      }
      this.pos.x = clamp(this.pos.x, -CITY.half, CITY.half);
      this.pos.z = clamp(this.pos.z, -CITY.half, CITY.half + 60);
      car.mesh.position.set(this.pos.x, 0, this.pos.z);
      car.mesh.rotation.y = this.heading;
      this.group.visible = false;
    }
  }

  enterCar(car) {
    this.car = car;
    this.onFoot = false;
    this.speed = 0;
    this.heading = car.mesh.rotation.y;
    this.pos.set(car.mesh.position.x, 0, car.mesh.position.z);
    this.group.visible = false;
  }

  exitCar() {
    if (!this.car) return;
    this.car = null;
    this.onFoot = true;
    this.speed = 0;
    this.pos.x += Math.sin(this.heading + Math.PI / 2) * 2.4;
    this.pos.z += Math.cos(this.heading + Math.PI / 2) * 2.4;
    this.group.visible = true;
    this.group.position.set(this.pos.x, 0, this.pos.z);
  }

  damage(amount) {
    this.health = clamp(this.health - amount, 0, 100);
    return this.health <= 0;
  }

  heal(amount) {
    this.health = clamp(this.health + amount, 0, 100);
  }
}
