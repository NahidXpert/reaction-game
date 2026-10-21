const KEY = 'reaction-timer:v1';
const EMPTY = { best: null, bestAverage: null };
const num = (v) => (Number.isFinite(v) && v > 0 ? v : null);

// localStorage can throw (private mode, blocked cookies, quota), so every call is guarded.
export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? {};
    return { best: num(d.best), bestAverage: num(d.bestAverage) };
  } catch {
    return { ...EMPTY };
  }
}

export function save(stats) {
  try { localStorage.setItem(KEY, JSON.stringify(stats)); return true; }
  catch { return false; } // the game keeps working, scores just won't persist
}