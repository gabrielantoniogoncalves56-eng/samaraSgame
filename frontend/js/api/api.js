/**
 * api.js
 * Única camada que a interface usa. Troca entre mockApi (demo local,
 * com bots) e backendApi (Google Apps Script, multiplayer real) sem
 * que nenhuma tela precise saber qual está ativa.
 */
import { CONFIG, setOnlineMode } from '../config.js';
import { mockApi } from './mockApi.js';
import { backendApi } from './backendApi.js';

function impl() {
  return CONFIG.ONLINE_MODE ? backendApi : mockApi;
}
function wrap(name) {
  return (...args) => impl()[name](...args);
}

export const API = {
  createRoom: wrap('createRoom'),
  joinRoom: wrap('joinRoom'),
  getRoom: wrap('getRoom'),
  startGame: wrap('startGame'),
  drawTile: wrap('drawTile'),
  placeTile: wrap('placeTile'),
  drawChallenge: wrap('drawChallenge'),
  answerChallenge: wrap('answerChallenge'),
  removePlayer: wrap('removePlayer'),
};

export function isOnlineMode() {
  return !!CONFIG.ONLINE_MODE;
}

/** Alterna entre backend real (Supabase) e modo demo local. Nunca deixa o app travado. */
export async function tryConnectBackend(wantOnline) {
  if (!wantOnline) {
    setOnlineMode(false);
    return { ok: true, mode: 'demo', message: 'Modo demo (local, com bots) ativado.' };
  }
  try {
    await backendApi.healthCheck();
    setOnlineMode(true);
    return { ok: true, mode: 'online', message: 'Conectado ao backend — o jogo agora é 100% online!' };
  } catch (e) {
    setOnlineMode(false);
    return { ok: false, mode: 'demo', message: 'Não foi possível conectar ao backend no momento. Modo demo ativado.' };
  }
}
