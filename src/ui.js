import { State, ROUNDS, average } from './game.js';

const $ = (id) => document.getElementById(id);
const ms = (n) => (n == null ? '–' : `${n} ms`);

// One entry per state: icon + text label, so color is never the only signal.
const VIEW = {
  [State.IDLE]: (s) => ({ icon: '▶', title: s.results.length ? `Round ${s.results.length + 1} of ${ROUNDS}` : 'Ready?', hint: 'Click, tap, or press Space to start' }),
  [State.WAITING]: () => ({ icon: '✋', title: 'Wait for green…', hint: "Don't click yet" }),
  [State.READY]: () => ({ icon: '⚡', title: 'GO!', hint: 'Click now!' }),
  [State.TOO_EARLY]: () => ({ icon: '⚠', title: 'Too soon!', hint: 'Click, tap, or press Space to retry' }),
  [State.RESULT]: (s) => ({ icon: '✓', title: `Round ${s.results.length} of ${ROUNDS}`, time: ms(s.lastTime), hint: 'Click, tap, or press Space for the next round' }),
  [State.COMPLETE]: (s) => ({ icon: '🏁', title: 'Series average', time: ms(average(s.results)), hint: 'Click, tap, or press Space to play again' }),
};

let prevState = null;

export function render(snap, stats, isNewBest) {
  const v = VIEW[snap.state](snap);
  const pad = $('pad');
  pad.dataset.state = snap.state;
  pad.dataset.pop = String(snap.state === State.RESULT || snap.state === State.COMPLETE);
  $('icon').textContent = v.icon;
  $('title').textContent = isNewBest ? `${v.title} · New best!` : v.title;
  $('time').textContent = v.time ?? '';
  $('hint').textContent = v.hint;

  $('best').textContent = ms(stats.best);
  $('best').classList.toggle('is-new', isNewBest);
  $('best-avg').textContent = ms(stats.bestAverage);
  $('series-avg').textContent = ms(average(snap.results));

  $('rounds').replaceChildren(...Array.from({ length: ROUNDS }, (_, i) => {
    const li = document.createElement('li');
    li.textContent = snap.results[i] != null ? `${snap.results[i]} ms` : '–';
    li.classList.toggle('is-done', snap.results[i] != null);
    return li;
  }));

  // Announce only on actual state changes to avoid chatty screen readers.
  if (snap.state !== prevState) {
    $('live').textContent = [v.title, v.time, v.hint].filter(Boolean).join('. ');
    prevState = snap.state;
  }
}

export function bindInput(onPress, onAbort) {
  // pointerdown fires earlier than click (no release wait), shaving real ms off the measurement.
  $('pad').addEventListener('pointerdown', (e) => {
    if (e.button === 0) { e.preventDefault(); onPress(e.timeStamp); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat) return; // held keys must not count as presses
    if (e.target !== document.body && e.target !== $('pad')) return;
    e.preventDefault();
    onPress(e.timeStamp);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) onAbort(); });
}