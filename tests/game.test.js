import { describe, it, expect } from 'vitest';
import { createGame, State, average, best, ROUNDS } from '../src/game.js';

// Fake clock + fake timers: no real waiting, fully deterministic.
function harness(delay = 2500) {
  let t = 1000;
  const timers = [];
  const game = createGame({
    now: () => t,
    randomDelay: () => delay,
    setTimer: (fn, ms) => timers.push({ fn, ms }) - 1,
    clearTimer: (id) => { timers[id] = null; },
  });
  const advance = (ms) => { t += ms; };
  const fire = () => { const i = timers.findIndex(Boolean); const x = timers[i]; timers[i] = null; x.fn(); };
  const play = (reaction) => { game.press(); fire(); advance(reaction); game.press(); advance(400); };
  return { game, timers, advance, fire, play };
}

describe('state machine', () => {
  it('goes idle -> waiting -> ready -> result and measures reaction time', () => {
    const h = harness();
    expect(h.game.getSnapshot().state).toBe(State.IDLE);
    h.game.press();
    expect(h.game.getSnapshot().state).toBe(State.WAITING);
    h.fire();
    expect(h.game.getSnapshot().state).toBe(State.READY);
    h.advance(237);
    h.game.press();
    expect(h.game.getSnapshot()).toMatchObject({ state: State.RESULT, lastTime: 237 });
  });

  it('uses the injected delay', () => {
    const h = harness(1234);
    h.game.press();
    expect(h.timers[0].ms).toBe(1234);
  });

  it('flags an early click, cancels the pending timer and records nothing', () => {
    const h = harness();
    h.game.press();
    h.advance(500);
    h.game.press();
    expect(h.game.getSnapshot()).toMatchObject({ state: State.TOO_EARLY, results: [] });
    expect(h.timers[0]).toBeNull();
  });

  it('ignores a double click right after a round ends', () => {
    const h = harness();
    h.game.press(); h.fire(); h.advance(200);
    h.game.press();
    h.advance(50);
    h.game.press(); // inside the lock window
    expect(h.game.getSnapshot().state).toBe(State.RESULT);
  });

  it('abort cancels a round in progress', () => {
    const h = harness();
    h.game.press();
    h.game.abort();
    expect(h.game.getSnapshot().state).toBe(State.IDLE);
    expect(h.timers[0]).toBeNull();
  });
});

describe('series', () => {
  it('completes after five rounds, then starts a fresh series', () => {
    const h = harness();
    [300, 200, 250, 350, 400].forEach(h.play);
    const snap = h.game.getSnapshot();
    expect(snap.state).toBe(State.COMPLETE);
    expect(snap.results).toHaveLength(ROUNDS);
    expect(average(snap.results)).toBe(300);
    expect(best(snap.results)).toBe(200);
    h.game.press();
    expect(h.game.getSnapshot()).toMatchObject({ state: State.WAITING, results: [] });
  });

  it('average and best handle empty input', () => {
    expect(average([])).toBeNull();
    expect(best([])).toBeNull();
  });
});