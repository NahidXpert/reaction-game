# Reaction Timer

A dependency-free, accessible reaction-time game with a tested state machine and persistent scores.

![Screenshot or GIF](docs/screenshot.gif)

**Live demo:** https://YOUR-USERNAME.github.io/reaction-timer/

## Features
- Random 1–5 s delay, then a full-screen go signal; time shown in ms
- "Too soon!" detection with instant retry
- Best-of-five series with per-round list and average
- Personal best and best average saved in `localStorage`
- Mouse, touch and keyboard (Space/Enter); responsive layout
- Text label + icon for every state, ARIA live announcements, visible focus, reduced-motion support

## Run locally
```bash
npm install
npm start      # serves on a local port (ES modules need http://, not file://)
npm test       # Vitest unit tests for the game logic
```

## Technical decisions
- **Timing:** `performance.now()` is monotonic and sub-millisecond; `Date.now()` can jump when the system clock changes. The UI passes the input event's own `timeStamp` to the logic, and input uses `pointerdown` rather than `click` to avoid waiting for release.
- **State machine:** `idle → waiting → ready → result | too-early → complete`. `game.js` has no DOM access, and the clock, delay source and timers are injected, so tests run instantly and deterministically.
- **Robustness:** pending timeouts are cleared on early clicks and tab switches, key repeat is ignored, and a 300 ms lock after a round absorbs double-clicks.
- **Accessibility:** the pad is a real `<button>`; state text colors are chosen for ≥4.5:1 contrast (dark text on green/amber); a polite live region announces state changes only when they change.
- **Storage:** all `localStorage` access is wrapped in try/catch, and stored values are validated on load.

## Challenges and what I learned
- A pending timer firing after an early click flipped the "Too soon!" screen to green. The fix was to treat cleanup as part of every transition, and a test now covers it.
- Browsers can't measure true input-to-photon latency. I minimized avoidable error (event timestamps, no transitions on the go signal) and documented the rest.
- Passing contrast checks meant using dark text on the green and amber states rather than white.

## Future improvements
- Recent-results chart and comparison with the ~250 ms human average
- Optional sound cue with mute toggle
- Playwright end-to-end test; installable PWA