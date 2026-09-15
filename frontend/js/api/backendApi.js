/**
 * backendApi.js
 * Cliente para o backend real (Google Apps Script Web App).
 * Implementa EXATAMENTE o mesmo contrato de funções que mockApi.js,
 * então a troca entre os dois é transparente para a interface — veja api.js.
 *
 * Detalhes técnicos importantes do Apps Script:
 * - Não existe WebSocket: usamos polling (syncService.js).
 * - Para evitar preflight CORS (Apps Script não responde bem a OPTIONS),
 *   usamos GET para leituras e POST com Content-Type "text/plain" para
 *   escritas — o Router.gs do backend já faz JSON.parse do corpo
 *   independente do header, então isso funciona sem problemas de CORS.
 */
import { CONFIG } from '../config.js';

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function baseUrl() {
  const url = CONFIG.API_BASE_URL;
  if (!url) throw new ApiError('SETUP_REQUIRED', 'Nenhuma URL de backend configurada.');
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
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS
    body: JSON.stringify({ action, ...params }),
  });
  return parse(res);
}

function flatten(obj) {
  // GET só aceita strings simples — objetos aninhados (settings) vão via POST
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && typeof v !== 'object') out[k] = String(v);
  });
  return out;
}

async function parse(res) {
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new ApiError('SERVER_ERROR', 'Resposta inválida do servidor.');
  }
  if (!json.success) {
    const err = json.error || {};
    throw new ApiError(err.code || 'SERVER_ERROR', err.message || 'Erro no servidor.');
  }
  return json.data;
}

export const backendApi = {
  createRoom: (p) => post('createRoom', p),
  joinRoom: (p) => post('joinRoom', p),
  getRoom: (p) => get('room', p),
  startGame: (p) => post('startGame', p),
  getQuestion: (p) => get('question', p),
  submitAnswer: (p) => post('submitAnswer', p),
  getQuestionResult: (p) => get('questionResult', p),
  leaderboard: (p) => get('leaderboard', p),
  nextQuestion: (p) => post('nextQuestion', p),
  finishGame: (p) => post('finishGame', p),
  removePlayer: (p) => post('removePlayer', p),

  /**
   * Verifica se a URL configurada aponta para um backend GeoBattle vivo.
   * Usa a ação "healthCheck" (roteada em Router.gs) e, em seguida, uma
   * consulta inofensiva para detectar se falta rodar setupProject().
   */
  async healthCheck() {
    const res = await fetch(`${baseUrl()}?action=healthCheck`);
    if (!res.ok) throw new ApiError('SERVER_ERROR', 'Backend indisponível.');
    const json = await res.json();
    if (!json.success) throw new ApiError(json.error?.code || 'SERVER_ERROR', json.error?.message || 'Backend indisponível.');

    // healthCheck responde mesmo sem a planilha configurada — testamos
    // uma leitura real para diferenciar "no ar" de "precisa setupProject()".
    const check = await fetch(`${baseUrl()}?action=room&roomCode=000000&playerId=health`);
    const checkJson = await check.json();
    if (!checkJson.success && checkJson.error && checkJson.error.code === 'SETUP_REQUIRED') {
      throw new ApiError('SETUP_REQUIRED', 'Backend no ar, mas setupProject() ainda não foi executado.');
    }
    return { ok: true };
  },
};
