// VELMARA HEAT — shops: three storefronts on the map. Walk close and press E to
// buy: a pistol at Ironworks Arms, a fresh fit at Neon Thread, and a performance
// mod at Torque Garage. Each purchase is real money out of the player's pocket.

import { ECONOMY } from './config.js';

export const SHOP_ITEMS = {
  weapon: { name: 'Pistol', cost: 800, blurb: 'Ironworks Arms — now you shoot back' },
  clothes: { name: 'Neon fit', cost: 350, blurb: 'Neon Thread — look like the city owns you' },
  mod: { name: 'Turbo mod', cost: 1200, blurb: 'Torque Garage — +12% acceleration, +10% top speed' },
};

export class ShopSys {
  constructor(world) {
    this.world = world;
  }

  nearest(playerPos) {
    let best = null;
    let bestDist = 7;
    for (const shop of this.world.city.places.shops) {
      const d = Math.hypot(shop.x - playerPos.x, shop.z - playerPos.z);
      if (d < bestDist) {
        bestDist = d;
        best = shop;
      }
    }
    return best;
  }

  itemFor(shop) {
    if (shop.name === 'Ironworks Arms') return 'weapon';
    if (shop.name === 'Neon Thread') return 'clothes';
    return 'mod';
  }

  buy(shop, player) {
    const kind = this.itemFor(shop);
    const item = SHOP_ITEMS[kind];
    if (kind === 'weapon' && player.hasWeapon) return 'You already own a pistol.';
    if (kind === 'mod' && player.modLevel >= 3) return 'The Comet is maxed out.';
    if (player.cash < item.cost) return 'Not enough cash for the ' + item.name + ' ($' + item.cost + ').';
    player.cash -= item.cost;
    if (kind === 'weapon') player.hasWeapon = true;
    if (kind === 'clothes') player.clothes += 1;
    if (kind === 'mod') player.modLevel += 1;
    this.world.audio.cash();
    return item.blurb + ' — $' + item.cost + '.';
  }

  promptFor(shop, player) {
    const kind = this.itemFor(shop);
    const item = SHOP_ITEMS[kind];
    return 'Press E — ' + shop.name + ': ' + item.name + ' $' + item.cost;
  }
}
