/**
 * api.js
 * Única camada que a interface usa. Troca entre mockApi (demo local,
 * com bots) e backendApi (Google Apps Script, multiplayer real) sem
 * que nenhuma tela precise saber qual está ativa.
 */
import { CONFIG, setApiUrl } from '../config.js';
import { mockApi } from './mockApi.js';
import { backendApi } from './backendApi.js';

function impl() {
  return CONFIG.API_BASE_URL ? backendApi : mockApi;
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
  return !!CONFIG.API_BASE_URL;
}

/** Testa e ativa a conexão com um backend real. Nunca deixa o app travado. */
export async function tryConnectBackend(url) {
  const trimmed = String(url || '').trim();
  const previous = CONFIG.API_BASE_URL;
  if (!trimmed) {
    setApiUrl('');
    return { ok: true, mode: 'demo', message: 'Modo demo (local, com bots) ativado.' };
  }
  setApiUrl(trimmed);
  try {
    await backendApi.healthCheck();
    return { ok: true, mode: 'online', message: 'Conectado ao backend — o jogo agora é 100% online!' };
  } catch (e) {
    setApiUrl(previous);
    return { ok: false, mode: previous ? 'online' : 'demo', message: 'Não foi possível conectar. Verifique a URL e o deploy do Web App.' };
  }
}
