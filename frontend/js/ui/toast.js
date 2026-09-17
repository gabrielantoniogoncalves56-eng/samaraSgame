/**
 * toast.js — notificações não bloqueantes.
 */
import { icon } from './icons.js';

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

const ICON = { success: 'check', error: 'cross', info: 'info' };

export function toast(message, type = 'info', duration = 3400) {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon">${icon(ICON[type] || 'info', { size: 18 })}</span><span class="toast__msg"></span>`;
  el.querySelector('.toast__msg').textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--show'));
  setTimeout(() => {
    el.classList.remove('toast--show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}
