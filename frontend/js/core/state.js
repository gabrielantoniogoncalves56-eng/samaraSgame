/**
 * state.js
 * Estado global simples e reativo (pub/sub), sem dependências externas.
 */
const listeners = new Set();

const state = {
  screen: 'home',
  session: null,       // { roomCode, playerId, playerName, isHost }
  room: null,           // objeto de sala retornado pela API
  currentQuestion: null,
  questionResult: null,
  finalResults: null,
  lastError: null,
  soundOn: localStorage.getItem('gb_sound') !== 'off',
  createSettings: null,
  loading: false,
};

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetGameState() {
  setState({
    session: null,
    room: null,
    currentQuestion: null,
    questionResult: null,
    finalResults: null,
  });
}
