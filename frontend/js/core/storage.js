/**
 * storage.js
 * Camada de persistência local — usada para reconexão automática
 * (o jogador não perde a sala ao recarregar a página).
 */
const KEY = 'gb_session';

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch (e) {
    /* localStorage indisponível — ignora silenciosamente */
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignora */
  }
}
