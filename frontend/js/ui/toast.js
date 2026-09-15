/**
 * toast.js
 * Notificações não-bloqueantes (erros, avisos, sucesso).
 */
let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = { success: '✅', error: '⚠️', info: 'ℹ️' };

export function toast(message, type = 'info', duration = 3600) {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon">${ICONS[type] || ICONS.info}</span><span class="toast__msg"></span>`;
  el.querySelector('.toast__msg').textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--show'));
  setTimeout(() => {
    el.classList.remove('toast--show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export function apiErrorToast(err) {
  const messages = {
    ROOM_NOT_FOUND: 'Essa sala não existe.',
    ROOM_FULL: 'Essa sala está cheia.',
    INVALID_ROOM_CODE: 'Código de sala inválido.',
    NAME_ALREADY_EXISTS: 'Esse nome já está sendo usado nessa sala.',
    GAME_ALREADY_STARTED: 'A partida já começou.',
    INVALID_QUESTION: 'Essa pergunta não é mais a atual.',
    ALREADY_ANSWERED: 'Você já respondeu essa pergunta.',
    TIME_EXPIRED: 'Tempo esgotado.',
    PLAYER_NOT_FOUND: 'Jogador não encontrado.',
    UNAUTHORIZED: 'Ação não autorizada.',
    INVALID_REQUEST: 'Requisição inválida.',
    SETUP_REQUIRED: 'Backend não configurado (execute setupProject()).',
  };
  toast(messages[err.code] || err.message || 'Não foi possível concluir a ação.', 'error');
}
