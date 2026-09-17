/**
 * modal.js — modal acessível simples.
 */
import { icon } from './icons.js';

let activeModal = null;

export function openModal({ title, bodyHtml, actions = [] }) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.innerHTML = `
    <button class="modal-close" aria-label="Fechar">${icon('close', { size: 18 })}</button>
    <h2 class="modal-title">${title}</h2>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-actions"></div>
  `;
  const actionsEl = box.querySelector('.modal-actions');
  actions.forEach((a) => {
    const btn = document.createElement('button');
    btn.className = `btn ${a.className || 'btn-secondary'}`;
    btn.textContent = a.label;
    btn.onclick = () => { a.onClick && a.onClick(); if (a.close !== false) closeModal(); };
    actionsEl.appendChild(btn);
  });

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  box.querySelector('.modal-close').onclick = closeModal;
  const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', escHandler);

  requestAnimationFrame(() => overlay.classList.add('modal-overlay--show'));
  activeModal = { overlay, escHandler };
  const focusable = box.querySelector('button, input, select, textarea');
  if (focusable) focusable.focus();
  return overlay;
}

export function closeModal() {
  if (!activeModal) return;
  const { overlay, escHandler } = activeModal;
  document.removeEventListener('keydown', escHandler);
  overlay.classList.remove('modal-overlay--show');
  setTimeout(() => overlay.remove(), 200);
  activeModal = null;
}
