// Pure game logic: no DOM, no storage. Time, delay and timers are injected so
// tests can run deterministically without real waiting.

export const State = Object.freeze({
  IDLE: 'idle', WAITING: 'waiting', READY: 'ready',
  RESULT: 'result', TOO_EARLY: 'too-early', COMPLETE: 'complete',
});
export const ROUNDS = 5;
const LOCK_MS = 300; // swallows double-clicks right after a round ends

export const defaultDelay = () => 1000 + Math.random() * 4000; // 1-5 s
export const average = (a) => (a.length ? Math.round(a.reduce((s, n) => s + n, 0) / a.length) : null);
export const best = (a) => (a.length ? Math.min(...a) : null);

export function createGame({
  now = () => performance.now(), // monotonic and high-res; Date.now() can jump with clock changes
  randomDelay = defaultDelay,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  onChange = () => {},
} = {}) {
  let state = State.IDLE, results = [], lastTime = null;
  let timerId = null, readyAt = 0, lockedUntil = 0;

  const getSnapshot = () => ({ state, results: [...results], lastTime, rounds: ROUNDS });
  const emit = () => onChange(getSnapshot());

  function clearPending() {
    if (timerId !== null) { clearTimer(timerId); timerId = null; }
  }

  function enter(next) {
    state = next;
    lockedUntil = now() + LOCK_MS;
    emit();
  }

  function startRound() {
    if (state === State.COMPLETE) { results = []; } // a new series starts after a completed one
    lastTime = null;
    state = State.WAITING;
    emit();
    timerId = setTimer(() => {
      timerId = null;
      state = State.READY;
      emit();
      // Stamped after the render so DOM work isn't charged to the player.
      // (Paint still lands up to one frame later; unavoidable in a browser.)
      readyAt = now();
    }, randomDelay());
  }

  // `at` lets the UI pass the input event's own timestamp, which is more
  // accurate than reading the clock after the event loop gets to us.
  function press(at = now()) {
    if (at < lockedUntil) return;
    switch (state) {
      case State.WAITING:
        clearPending(); // otherwise the stale timer would flip a "too early" screen to green
        enter(State.TOO_EARLY);
        break;
      case State.READY:
        lastTime = Math.max(0, Math.round(at - readyAt));
        results.push(lastTime);
        enter(results.length >= ROUNDS ? State.COMPLETE : State.RESULT);
        break;
      default: // idle, result, too-early, complete -> (re)start; too-early retries the same round
        startRound();
    }
  }

  // Tab hidden mid-round: timers are throttled and a measurement would be junk.
  function abort() {
    if (state !== State.WAITING && state !== State.READY) return;
    clearPending();
    state = State.IDLE;
    emit();
  }

  return { press, abort, getSnapshot };
}