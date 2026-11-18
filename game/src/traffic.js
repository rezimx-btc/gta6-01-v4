// VELMARA HEAT — traffic and pedestrians: cars cruise the street grid on fixed
// lanes and pedestrians stroll the sidewalks. Cars slow for the one ahead of them
// and wrap around the city edge; pedestrians pick a new corner when they arrive.

import * as THREE from 'three';
import { CITY, SPEED } from './config.js';
import { range, rangeInt, pick } from './random.js';

const CAR_COLORS = [0xd83a3a, 0x3a6fd8, 0xe8c33a, 0x37b06a, 0xd8d8d8, 0x2a2a33, 0x8a5fd8, 0xe07a2a];
const PED_COLORS = [0xff8a5c, 0x5cc8ff, 0xffd166, 0x9dff6e, 0xff5a7a, 0xc9a0ff, 0x7dffce];

export function makeCarMesh(color, police) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.62, 4.4),
    new THREE.MeshLambertMaterial({ color: police ? 0x1c2733 : color }),
  );
  body.position.y = 0.55;
  group.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.55, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x18202c }),
  );
  cabin.position.set(0, 1.1, -0.2);
  group.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const spots = [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]];
  for (const [x, z] of spots) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.36, z);
    group.add(wheel);
  }
  if (police) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.18, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x3355ff, emissiveIntensity: 1.4 }),
    );
    bar.position.set(0, 1.45, -0.2);
    bar.name = 'lightbar';
    group.add(bar);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.12, 0.2, 4.42),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    );
    stripe.position.y = 0.72;
    group.add(stripe);
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return group;
}

function makePedMesh(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.05, 0.34),
    new THREE.MeshLambertMaterial({ color }),
  );
  body.position.y = 0.95;
  group.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xe8b88a }),
  );
  head.position.y = 1.66;
  group.add(head);
  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.45, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x2a2a33 }),
  );
  legs.position.y = 0.22;
  group.add(legs);
  return group;
}

function streetCenters() {
  const step = CITY.block + CITY.road;
  const list = [];
  for (let i = 0; i <= CITY.blocks; i += 1) list.push(-CITY.half + i * step);
  return list;
}

export class Traffic {
  constructor(scene, rng, city) {
    this.scene = scene;
    this.rng = rng;
    this.city = city;
    this.streets = streetCenters();
    this.cars = [];
    this.peds = [];
    for (let i = 0; i < 26; i += 1) this.spawnCar(true);
    for (let i = 0; i < 40; i += 1) this.spawnPed(true);
  }

  spawnCar(anywhere) {
    const vertical = this.rng() < 0.5;
    const street = pick(this.rng, this.streets);
    const along = anywhere ? range(this.rng, -CITY.half, CITY.half) : (this.rng() < 0.5 ? -CITY.half : CITY.half);
    const dir = this.rng() < 0.5 ? 1 : -1;
    const mesh = makeCarMesh(pick(this.rng, CAR_COLORS), false);
    const car = {
      mesh,
      vertical,
      street,
      along,
      dir,
      speed: range(this.rng, 6, SPEED.trafficCruise),
      color: 0xffffff,
      stolen: false,
    };
    this.cars.push(car);
    this.scene.add(mesh);
    return car;
  }

  spawnPed(anywhere) {
    const x = range(this.rng, -CITY.half, CITY.half);
    const z = range(this.rng, -CITY.half, CITY.half);
    const mesh = makePedMesh(pick(this.rng, PED_COLORS));
    const ped = {
      mesh, x, z,
      tx: range(this.rng, -CITY.half, CITY.half),
      tz: range(this.rng, -CITY.half, CITY.half),
      speed: range(this.rng, 0.8, SPEED.pedWalk),
      flee: 0,
    };
    mesh.position.set(x, 0, z);
    this.peds.push(ped);
    this.scene.add(mesh);
    return ped;
  }

  nearestCar(pos, maxDist) {
    let best = null;
    let bestDist = maxDist;
    for (const car of this.cars) {
      if (car.stolen) continue;
      const d = Math.hypot(car.mesh.position.x - pos.x, car.mesh.position.z - pos.z);
      if (d < bestDist) {
        bestDist = d;
        best = car;
      }
    }
    return best;
  }

  stealCar(car) {
    car.stolen = true;
    return car;
  }

  update(dt, player) {
    for (const car of this.cars) {
      if (car.stolen) continue;
      let target = SPEED.trafficCruise;
      for (const other of this.cars) {
        if (other === car || other.stolen || other.vertical !== car.vertical || other.street !== car.street) continue;
        const gap = (other.along - car.along) * car.dir;
        if (gap > 0 && gap < 12) target = Math.min(target, 3);
      }
      car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
      car.along += car.dir * car.speed * dt;
      if (car.along > CITY.half + 20) car.along = -CITY.half - 20;
      if (car.along < -CITY.half - 20) car.along = CITY.half + 20;
      const x = car.vertical ? car.street : car.along;
      const z = car.vertical ? car.along : car.street;
      car.mesh.position.set(x, 0, z);
      car.mesh.rotation.y = car.vertical ? (car.dir > 0 ? 0 : Math.PI) : (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    for (const ped of this.peds) {
      const dx = ped.tx - ped.x;
      const dz = ped.tz - ped.z;
      const dist = Math.hypot(dx, dz);
      const speed = ped.flee > 0 ? 3.2 : ped.speed;
      if (dist < 1.5) {
        ped.tx = range(this.rng, -CITY.half, CITY.half);
        ped.tz = range(this.rng, -CITY.half, CITY.half);
      } else {
        ped.x += (dx / dist) * speed * dt;
        ped.z += (dz / dist) * speed * dt;
        ped.mesh.rotation.y = Math.atan2(dx, dz);
      }
      if (ped.flee > 0) ped.flee -= dt;
      ped.mesh.position.set(ped.x, 0, ped.z);
    }
  }
}
