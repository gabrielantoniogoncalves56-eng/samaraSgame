/**
 * api.js
 * Camada de abstração única usada por TODA a interface.
 * A interface nunca importa mockApi ou backendApi diretamente — sempre
 * importa `API` deste arquivo. Isso permite trocar a implementação em
 * tempo real sem tocar em nenhuma tela.
 *
 * INTEGRAÇÃO AUTOMÁTICA:
 * Ao salvar uma URL de Web App válida (tela Configurações), o app testa
 * a conexão (backendApi.healthCheck) e, se responder, alterna sozinho
 * para API_MODE = "backend". Se a conexão falhar a qualquer momento
 * durante o jogo, o app avisa o usuário — ele pode voltar ao modo
 * demo (mock) a qualquer momento sem perder o fluxo da interface.
 */
import { CONFIG, setApiMode } from '../config.js';
import { mockApi } from './mockApi.js';
import { backendApi } from './backendApi.js';

function impl() {
  return CONFIG.API_MODE === 'backend' ? backendApi : mockApi;
}

function wrap(name) {
  return (...args) => impl()[name](...args);
}

export const API = {
  createRoom: wrap('createRoom'),
  joinRoom: wrap('joinRoom'),
  getRoom: wrap('getRoom'),
  startGame: wrap('startGame'),
  getQuestion: wrap('getQuestion'),
  submitAnswer: wrap('submitAnswer'),
  getQuestionResult: wrap('getQuestionResult'),
  leaderboard: wrap('leaderboard'),
  nextQuestion: wrap('nextQuestion'),
  finishGame: wrap('finishGame'),
  removePlayer: wrap('removePlayer'),
};

/**
 * Testa e ativa a conexão com um backend real. Retorna { ok, mode, message }.
 * Em caso de falha, garante que o app continue em modo mock (nunca trava).
 */
export async function tryConnectBackend(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) {
    setApiMode('mock', '');
    return { ok: true, mode: 'mock', message: 'Modo demo (offline) ativado.' };
  }
  const previousMode = CONFIG.API_MODE;
  const previousUrl = CONFIG.API_BASE_URL;
  setApiMode('backend', trimmed);
  try {
    await backendApi.healthCheck();
    return { ok: true, mode: 'backend', message: 'Conectado ao backend com sucesso! A API agora é automática.' };
  } catch (e) {
    if (e.code === 'SETUP_REQUIRED') {
      return { ok: true, mode: 'backend', message: 'Conectado, mas execute setupProject() na planilha antes de jogar.' };
    }
    setApiMode(previousMode, previousUrl);
    return { ok: false, mode: previousMode, message: 'Não foi possível conectar. Verifique a URL e o deploy do Web App.' };
  }
}

export function currentMode() {
  return CONFIG.API_MODE;
}
