# VELMARA HEAT — an open-world crime game

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/rezimx-btc/gta6-01-v4/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/rezimx-btc/gta6-01-v4/reward.svg)](https://make.fun/bounty/gta6-01)

**VELMARA HEAT** is a complete open-world crime game in the browser: a sun-soaked
coastal city you explore on foot and by car, with traffic and pedestrians, cars to
steal and drive, a wanted level with police cars and a helicopter, 8 story missions
across 3 acts, combat, shops, a live pirate-radio broadcast you run, a HUD with a
minimap, a start screen and saves. Everything is original: the city of Velmara Bay,
its people, its cars, its music and its story.

## The hook: WAVE 98 VELMARA

You are Rio "Wavelength" Vega, getaway driver by night and pirate-radio DJ by day.
Every mission you finish goes out live on your station — listeners climb, callers
phone in, and the city starts to know your name. Heat brings listeners. Listeners
bring heat.

## Play

- **Move:** WASD to walk (5 km/h on foot) or drive, mouse to look, Shift to sprint.
- **Steal a car:** walk up to any parked or traffic car and press E. F to fight.
- **Wanted:** cause trouble and the stars climb; at 3 stars the police helicopter
  joins the chase. Lose the cops to cool down.
- **Missions:** follow the gold marker. 8 missions, 3 acts, from a first joyride to
  the Prime Time broadcast heist.
- **Money:** earn cash from missions, spend it at Torque Garage (car mods),
  Ironworks Arms (weapons) and Neon Thread (clothes).
- **Radio:** 1 / 2 / 3 switch stations — WAVE 98 talk, Neon FM synth, Tide AM jazz.
- **Save:** the game autosaves after every mission; press P to save anytime.

## Run it

```sh
node serve.ts --port 8082
# open http://localhost:8082
```

The game is plain static files under `game/` with no build step and no network
request: open `game/index.html` from any static server. Three.js r160 is vendored
under `game/vendor/`.

## Screenshots

The cover shows a police chase at 3 stars on Ocean Drive with the minimap, the
wanted level and the mission objective on the HUD; the others show driving the
coast road, a mission in progress at the marina, and the police helicopter over
the bay at night.

## Missions (3 acts, 8 missions)

1. **Static** — joyride a stolen Comet to the studio before the first broadcast.
2. **Dead Air** — lose a 2-star tail through the market district.
3. **Signal Boost** — plant the transmitter on the Marina Tower roof.
4. **Callers** — pick up three callers across the city while the cops listen in.
5. **Prime Time** — the broadcast heist: drive the vault truck to the pier.
6. **Feedback** — escape the 4-star dragnet after the heist goes loud.
7. **Dead Frequency** — silence the rival station's jammer van.
8. **Sign Off** — the final run: one last broadcast from the lighthouse.

## License

MIT — see `LICENSE`. Velmara Bay, its people and its stations are original
fiction. No Rockstar Games names, characters, maps or assets are used.
