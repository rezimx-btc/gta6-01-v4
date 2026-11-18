// VELMARA HEAT — screenshot scenes: each one plays the real rules forward from
// a fresh world for a fixed number of steps, steered by a simple autopilot, so
// the frame is what a short game really looks like and the same seed always
// gives the same frame. chase: a 3-star pursuit on Ocean Drive. drive: the coast
// road at speed. mission: on foot at the marina with the gold marker. heli: the
// police helicopter over the bay at 4 stars.

const STEP = 1 / 60;

function fakeInput() {
  return {
    axis: () => ({ x: 0, z: -1 }),
    sprinting: () => false,
    wasPressed: () => false,
    consumeMouse: () => ({ dx: 0, dy: 0 }),
    endFrame: () => {},
  };
}

function driveToward(game, tx, tz, seconds, speedTarget) {
  const input = fakeInput();
  const player = game.player;
  for (let i = 0; i < seconds / STEP; i += 1) {
    const dx = tx - player.pos.x;
    const dz = tz - player.pos.z;
    const want = Math.atan2(dx, dz);
    let diff = want - player.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.heading += Math.max(-0.06, Math.min(0.06, diff * 0.2));
    if (player.car) {
      player.speed += (speedTarget - player.speed) * 0.02;
      const nx = player.pos.x + Math.sin(player.heading) * player.speed * STEP;
      const nz = player.pos.z + Math.cos(player.heading) * player.speed * STEP;
      player.pos.x = nx;
      player.pos.z = nz;
      player.car.mesh.position.set(nx, 0, nz);
      player.car.mesh.rotation.y = player.heading;
    }
    game.traffic.update(STEP, player);
    game.police.update(STEP, player, game);
    game.heli.setActive(game.police.wanted >= 3);
    game.heli.update(STEP, player.pos);
    game.renderer.updateCamera(STEP, player, input);
    game.renderer.updateHUD(STEP, game);
    game.time += STEP;
  }
}

export function stageShot(name, game) {
  game.state = 'play';
  document.getElementById('screen').style.display = 'none';
  const player = game.player;
  const scene = name || 'drive';
  if (scene === 'chase') {
    const car = game.traffic.cars[0];
    game.traffic.stealCar(car);
    player.enterCar(car);
    player.pos.set(30, 0, 250);
    player.heading = Math.PI;
    player.speed = 20;
    game.police.addHeat(3);
    game.police.spawnCop(player.pos);
    game.police.spawnCop(player.pos);
    game.missions.index = 1;
    driveToward(game, 30, 120, 7, 26);
    // Frame the pursuit: both units flanking the Comet, just behind it.
    const fwdX = Math.sin(player.heading);
    const fwdZ = Math.cos(player.heading);
    const leftX = Math.cos(player.heading);
    const leftZ = -Math.sin(player.heading);
    const cops = game.police.cops;
    if (cops[0]) {
      cops[0].x = player.pos.x - fwdX * 6 + leftX * 7;
      cops[0].z = player.pos.z - fwdZ * 6 + leftZ * 7;
      cops[0].mesh.position.set(cops[0].x, 0, cops[0].z);
    }
    if (cops[1]) {
      cops[1].x = player.pos.x - fwdX * 8 - leftX * 7;
      cops[1].z = player.pos.z - fwdZ * 8 - leftZ * 7;
      cops[1].mesh.position.set(cops[1].x, 0, cops[1].z);
    }
    game.renderer.updateCamera(STEP, player, fakeInput());
  } else if (scene === 'mission') {
    player.pos.set(-150, 0, -10);
    player.heading = Math.PI * 0.75;
    player.group.position.set(player.pos.x, 0, player.pos.z);
    player.group.rotation.y = player.heading;
    game.missions.index = 2;
    for (let i = 0; i < 120; i += 1) {
      game.traffic.update(STEP, player);
      game.renderer.updateCamera(STEP, player, fakeInput());
      game.renderer.updateHUD(STEP, game);
      game.time += STEP;
    }
  } else if (scene === 'heli') {
    const car = game.traffic.cars[3];
    game.traffic.stealCar(car);
    player.enterCar(car);
    player.pos.set(90, 0, 180);
    player.heading = Math.PI * 0.5;
    player.speed = 18;
    game.police.addHeat(4);
    game.police.spawnCop(player.pos);
    game.heli.setActive(true);
    driveToward(game, 90, 40, 7, 22);
    // Park the helicopter in frame: low, ahead of the car, spotlight on it.
    game.heli.angle = -Math.PI / 2;
    game.heli.update(0.001, player.pos);
    game.heli.group.position.set(player.pos.x + 6, 12, player.pos.z - 24);
    game.heli.group.rotation.y = Math.atan2(-6, 24);
    game.renderer.pitch = 0.16;
    game.renderer.updateCamera(STEP, player, fakeInput());
  } else {
    const car = game.traffic.cars[1];
    game.traffic.stealCar(car);
    player.enterCar(car);
    player.pos.set(-30, 0, 252);
    player.heading = Math.PI;
    player.speed = 24;
    game.missions.index = 0;
    driveToward(game, -30, 20, 7, 28);
  }
  // Gold mission marker over the current objective, like the live game shows.
  const m = game.missions.current();
  if (m && !game.missions.done) {
    game.marker.position.set(m.target.x, 8, m.target.z);
    game.marker.visible = true;
    game.markerBeam.position.set(m.target.x, 30, m.target.z);
    game.markerBeam.visible = true;
  }
  game.renderer.updateHUD(0, game);
}

export function shotNames() {
  return ['chase', 'drive', 'mission', 'heli'];
}
