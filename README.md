# Ember &amp; Thyme — Kitchen Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/flamsx/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/flamsx/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A rush-hour cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). Tickets roll in on the order board, you build each dish on your plate from six ingredient bins, mind the grill (a patty is ready after 4 seconds and burns after 9), and ring the serve bell before a ticket's patience runs out. Three hearts, one 3-minute shift, four recipes that unlock as the rush builds.

## Play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open http://localhost:8080). No network request, no build step, keyboard + mouse.

- **1–6** or click: bun, patty, tomato, lettuce, cheese, sauce
- **Click the grill** (or **G**): collect a ready patty, bin a burnt one
- **Enter**: serve the plate when it matches a ticket
- **T**: bin the plate · **P**: pause · **M**: mute · **R**: restart

## Screenshots

Real renders of the game's own code (`?shot=start|play|serve|end&seed=1`):

1. `1-play.jpg` — mid-shift: order board, ingredients on the counter, a dish mid-assembly, the grill, the timer and a plate ready to serve
2. `2-start.jpg` — title screen over the kitchen
3. `3-serve.jpg` — a completed Garden Burger matching its ticket, bell lit
4. `4-end.jpg` — results screen with stars

## Structure

- `game/src/config.js` — tuning, palette, recipes, layout
- `game/src/state.js` — the kitchen's state and its transitions
- `game/src/render.js` — every pixel: wall, board, grill, plate, serve window, chef
- `game/src/input.js` — mouse + keyboard
- `game/src/particles.js` — steam, sparkles, floating coin text
- `game/src/audio.js` — synthesised WebAudio kitchen sounds
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — boot and fixed-step loop
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)

## License

MIT — see [LICENSE](LICENSE).
