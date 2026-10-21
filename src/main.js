import { createGame, State, average } from './game.js';
import { load, save } from './storage.js';
import { render, bindInput } from './ui.js';

let stats = load();

const game = createGame({
  onChange(snap) {
    let isNewBest = false;
    if (snap.state === State.RESULT || snap.state === State.COMPLETE) {
      if (stats.best === null || snap.lastTime < stats.best) {
        stats = { ...stats, best: snap.lastTime };
        isNewBest = true;
      }
      if (snap.state === State.COMPLETE) {
        const avg = average(snap.results);
        if (stats.bestAverage === null || avg < stats.bestAverage) stats = { ...stats, bestAverage: avg };
      }
      save(stats);
    }
    render(snap, stats, isNewBest);
  },
});

bindInput((at) => game.press(at), () => game.abort());
render(game.getSnapshot(), stats, false);