// VELMARA HEAT — the city: a procedural coastal grid built from one seeded RNG.
// Streets, sidewalks and crosswalks are painted once onto a ground canvas texture;
// buildings are boxes with lit windows, each roof finished with a parapet, an AC
// unit and, on the tall ones, a red beacon. The beach, the ocean and the pier run
// along the south edge. Every building also registers a soft AABB collider.

import * as THREE from 'three';
import { CITY } from './config.js';
import { range, rangeInt, pick } from './random.js';

const PALETTE = [0xb59a7a, 0x7f96b8, 0xa37f94, 0x6f9a7d, 0xc4ab84, 0x8f7fb8, 0xb5815f, 0x7ba3b5];
const NEON = [0xff5a7a, 0x37e6ff, 0xffd166, 0x9dff6e, 0xff9a3d];

function groundTexture(rng) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const step = CITY.block + CITY.road;
  const world = CITY.blocks * step;
  const toPx = (v) => ((v + world / 2) / world) * size;
  g.fillStyle = '#555a66';
  g.fillRect(0, 0, size, size);
  // Sidewalk blocks.
  for (let bx = 0; bx < CITY.blocks; bx += 1) {
    for (let bz = 0; bz < CITY.blocks; bz += 1) {
      const x0 = -world / 2 + bx * step + CITY.road / 2;
      const z0 = -world / 2 + bz * step + CITY.road / 2;
      g.fillStyle = (bx + bz) % 2 === 0 ? '#6e737f' : '#656a76';
      g.fillRect(toPx(x0), toPx(z0), toPx(x0 + CITY.block) - toPx(x0), toPx(z0 + CITY.block) - toPx(z0));
    }
  }
  // Road centre dashes.
  g.fillStyle = '#e8d44d';
  for (let i = 0; i < CITY.blocks + 1; i += 1) {
    const c = -world / 2 + i * step - CITY.road / 2;
    for (let d = -world / 2; d < world / 2; d += 18) {
      g.fillRect(toPx(c) - 2, toPx(d), 4, 8);
      g.fillRect(toPx(d), toPx(c) - 2, 8, 4);
    }
  }
  // Beach and ocean at the south edge.
  const beachY = toPx(CITY.beachZ);
  g.fillStyle = '#e0c184';
  g.fillRect(0, beachY, size, size - beachY);
  g.fillStyle = '#3f8fc9';
  g.fillRect(0, toPx(CITY.oceanZ), size, size - toPx(CITY.oceanZ));
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 40; i += 1) g.fillRect(rng() * size, toPx(CITY.oceanZ) + rng() * 26, 26, 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function windowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = '#c8ccd4';
  g.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 248; y += 18) {
    for (let x = 8; x < 120; x += 18) {
      const lit = Math.random() < 0.55;
      g.fillStyle = lit ? '#ffd166' : '#4a5266';
      g.fillRect(x, y, 10, 12);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function box(w, h, d, color, x, y, z, emissive) {
  const mat = new THREE.MeshLambertMaterial({ color });
  if (emissive) {
    mat.emissive = new THREE.Color(emissive);
    mat.emissiveIntensity = 0.9;
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

export function buildCity(scene, rng) {
  const colliders = [];
  const group = new THREE.Group();
  const step = CITY.block + CITY.road;
  const world = CITY.blocks * step;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(world + 220, world + 220),
    new THREE.MeshLambertMaterial({ map: groundTexture(rng) }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 40);
  group.add(ground);
  const winTex = windowTexture();
  const litMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (let bx = 0; bx < CITY.blocks; bx += 1) {
    for (let bz = 0; bz < CITY.blocks; bz += 1) {
      const cx = -CITY.half + bx * step + CITY.road / 2 + CITY.block / 2;
      const cz = -CITY.half + bz * step + CITY.road / 2 + CITY.block / 2;
      // The studio block stays open: the broadcast plaza.
      if (bx === 4 && bz === 7) continue;
      const count = rangeInt(rng, 1, 2);
      for (let k = 0; k < count; k += 1) {
        const w = range(rng, 16, CITY.block - 6);
        const d = range(rng, 16, CITY.block - 6);
        const h = range(rng, CITY.buildingMin, CITY.buildingMax);
        const x = cx + (count === 1 ? 0 : (k === 0 ? -9 : 9));
        const z = cz + (count === 1 ? 0 : (k === 0 ? -8 : 8));
        const color = pick(rng, PALETTE);
        const mat = new THREE.MeshLambertMaterial({ color, map: winTex });
        const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        tower.position.set(x, h / 2, z);
        group.add(tower);
        // Parapet: a thin slab lip around the roof edge.
        const parapet = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.8, 0.9, d + 0.8),
          new THREE.MeshLambertMaterial({ color: 0x2c2f38 }),
        );
        parapet.position.set(x, h + 0.45, z);
        group.add(parapet);
        // Rooftop AC unit.
        const ac = box(2.2, 1.1, 1.6, 0x9aa2ad, x + w / 5, h + 1.4, z - d / 5);
        group.add(ac);
        // Neon sign on some buildings.
        if (rng() < 0.3) {
          const sign = box(w * 0.5, 1.2, 0.4, 0x111111, x, h * 0.72, z + d / 2 + 0.3, pick(rng, NEON));
          group.add(sign);
        }
        // Red beacon on tall towers.
        if (h > 40) {
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2 }),
          );
          beacon.position.set(x, h + 1.6, z);
          group.add(beacon);
        }
        colliders.push({ x, z, hw: w / 2, hd: d / 2 });
      }
    }
  }
  // Palms along Ocean Drive.
  for (let i = 0; i < 26; i += 1) {
    const x = -260 + i * 21 + range(rng, -4, 4);
    const z = CITY.beachZ - 8;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.42, 7, 7),
      new THREE.MeshLambertMaterial({ color: 0x7a5a38 }),
    );
    trunk.position.set(x, 3.5, z);
    trunk.rotation.z = range(rng, -0.12, 0.12);
    group.add(trunk);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 3.4, 8),
      new THREE.MeshLambertMaterial({ color: 0x2f7a3d }),
    );
    crown.position.set(x, 8.2, z);
    group.add(crown);
  }
  // The pier: planks out over the water.
  for (let i = 0; i < 14; i += 1) {
    const plank = box(10, 0.5, 3.2, 0x8a6a44, CITY.pierX, 0.6, CITY.pierZ + i * 3.4);
    group.add(plank);
  }
  // Street lamps down the main avenues.
  for (let i = 0; i < 20; i += 1) {
    const x = -CITY.half + (i % 10) * 60 + 8;
    const z = -CITY.half + Math.floor(i / 10) * 300 + 40;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    pole.position.set(x, 3, z);
    group.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xffe9a8, emissive: 0xffdf8a, emissiveIntensity: 1.6 }),
    );
    lamp.position.set(x, 6.2, z);
    group.add(lamp);
  }
  scene.add(group);
  const places = {
    studio: { x: 0, z: 200 },
    marinaTower: { x: -180, z: -40 },
    market: { x: 120, z: 60 },
    lighthouse: { x: 230, z: -230 },
    pier: { x: CITY.pierX, z: CITY.pierZ },
    shops: [
      { x: 96, z: 84, name: 'Torque Garage' },
      { x: -144, z: -16, name: 'Ironworks Arms' },
      { x: 150, z: 36, name: 'Neon Thread' },
    ],
  };
  return { group, colliders, places, update() {} };
}
