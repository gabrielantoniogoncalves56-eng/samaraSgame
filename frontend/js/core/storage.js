/**
 * storage.js — persistência local para reconexão automática.
 */
const KEY = 'rotas_session';

export function saveSession(session) {
  try { localStorage.setItem(KEY, JSON.stringify(session)); } catch (e) { /* ignora */ }
}
export function loadSession() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
export function clearSession() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
}
