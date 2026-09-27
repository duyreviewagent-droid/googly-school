# Googly School

Three years of high school in one hour, as a googly. Make the best decisions — or the worst.

- `web/public` is the whole game (three.js, no build step). `node web/server.js` serves it on http://localhost:8141.
- `mac/build.sh` builds **Googly School.app** (offline; the game is served over `gschool://`).
- Test hooks: `?y=2&d=5&p=7` (start at year/day/phase), `auto=1` (autoplay), `speed=N`, `lq=1`, `rich=1`, `det=N`, `icon=1`.
- `node web/test/auto.mjs "query" seconds` runs autoplay headless and prints the state every 6 s.
