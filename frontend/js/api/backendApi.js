/**
 * backendApi.js
 * Cliente do backend real (Google Apps Script Web App). Implementa
 * exatamente o mesmo contrato do mockApi.js — veja api.js para a troca
 * automática entre os dois.
 *
 * GET para leituras, POST com Content-Type "text/plain" para escritas
 * (evita o preflight CORS que o Apps Script não trata bem).
 */
import { CONFIG } from '../config.js';

class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function baseUrl() {
  const url = CONFIG.API_BASE_URL;
  if (!url) throw new ApiError('SETUP_REQUIRED', 'Nenhum backend configurado — cole a URL na tela Configurações.');
  return url;
}

async function get(action, params = {}) {
  const qs = new URLSearchParams({ action, ...flatten(params) });
  const res = await fetch(`${baseUrl()}?${qs.toString()}`, { method: 'GET' });
  return parse(res);
}
async function post(action, params = {}) {
  const res = await fetch(baseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...params }),
  });
  return parse(res);
}
function flatten(obj) {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && typeof v !== 'object') out[k] = String(v); });
  return out;
}
async function parse(res) {
  let json;
  try { json = await res.json(); } catch (e) { throw new ApiError('SERVER_ERROR', 'Resposta inválida do servidor.'); }
  if (!json.success) {
    const err = json.error || {};
    throw new ApiError(err.code || 'SERVER_ERROR', err.message || 'Erro no servidor.');
  }
  return json.data;
}

export const backendApi = {
  createRoom: (p) => post('createRoom', p),
  joinRoom: (p) => post('joinRoom', p),
  getRoom: (p) => get('getRoom', p),
  startGame: (p) => post('startGame', p),
  drawTile: (p) => post('drawTile', p),
  placeTile: (p) => post('placeTile', p),
  drawChallenge: (p) => post('drawChallenge', p),
  answerChallenge: (p) => post('answerChallenge', p),
  removePlayer: (p) => post('removePlayer', p),

  async healthCheck() {
    const res = await fetch(`${baseUrl()}?action=healthCheck`);
    if (!res.ok) throw new ApiError('SERVER_ERROR', 'Backend indisponível.');
    const json = await res.json();
    if (!json.success) throw new ApiError(json.error?.code || 'SERVER_ERROR', json.error?.message || 'Backend indisponível.');
    return { ok: true };
  },
};
