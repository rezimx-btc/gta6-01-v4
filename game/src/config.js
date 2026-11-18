// VELMARA HEAT — shared constants: the city, the speeds, the prices, the radio.
// Every number the game uses lives here, typed once, so the systems agree with
// each other and the HUD never lies about what the simulation does.

export const CITY = {
  blocks: 9,
  block: 46,
  road: 14,
  // Half-extent of the drivable street grid, in metres.
  half: 270,
  // South edge: the beach starts here, the ocean past it.
  beachZ: 288,
  oceanZ: 330,
  pierX: 0,
  pierZ: 306,
  buildingMin: 14,
  buildingMax: 52,
};

export const SPEED = {
  // On foot: exactly 5 km/h, as the HUD promises.
  walk: 1.39,
  sprint: 3.4,
  // Cars, metres per second.
  carAccel: 14,
  carBrake: 30,
  carReverse: 9,
  carMax: 38,
  carTurn: 2.1,
  trafficCruise: 8.5,
  pedWalk: 1.1,
  heliCruise: 22,
};

export const WANTED = {
  decaySeconds: 26,
  // Heat thresholds at which each response tier joins the chase.
  copAt: 1,
  heliAt: 3,
  maxCops: 6,
};

export const ECONOMY = {
  startCash: 250,
  missionPay: [400, 650, 900, 1100, 2500, 1400, 1600, 4000],
  weaponCost: 800,
  clothesCost: 350,
  modCost: 1200,
  carReward: 0,
};

export const RADIO = {
  stations: [
    { id: 0, name: 'WAVE 98', desc: 'Rio on air — talk, callers, static', freq: 98.1 },
    { id: 1, name: 'NEON FM', desc: 'synthwave all night', freq: 101.7 },
    { id: 2, name: 'TIDE AM', desc: 'late jazz from the pier', freq: 1240 },
  ],
};

export const MISSION_COUNT = 8;
export const ACTS = ['STATIC', 'BROADCAST', 'PRIME TIME'];
export const DISTRICTS = [
  { name: 'Ocean Drive', x: 0, z: 240, note: 'beachfront strip' },
  { name: 'Marina District', x: -180, z: -40, note: 'boats and towers' },
  { name: 'Market Row', x: 120, z: 60, note: 'neon and food stalls' },
  { name: 'Old Velmara', x: -60, z: -180, note: 'brick lanes, low roofs' },
  { name: 'Lighthouse Point', x: 230, z: -230, note: 'the last broadcast' },
];
