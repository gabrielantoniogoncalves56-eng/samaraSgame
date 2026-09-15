/**
 * router.js
 * Roteador de telas para a SPA GeoBattle.
 * Cada "página" é um módulo com render(root) e opcionalmente destroy().
 */
import { setState } from './state.js';

const registry = new Map();
let current = null;
let rootEl = null;

export function registerPage(name, page) {
  registry.set(name, page);
}

export function initRouter(root) {
  rootEl = root;
}

export function navigate(name, params = {}) {
  const page = registry.get(name);
  if (!page) {
    console.error(`[router] tela desconhecida: ${name}`);
    return;
  }
  if (current && current.page.destroy) {
    try { current.page.destroy(); } catch (e) { /* noop */ }
  }

  rootEl.classList.remove('screen-in');
  // força reflow para reiniciar a animação de transição
  void rootEl.offsetWidth;

  rootEl.innerHTML = '';
  setState({ screen: name });
  page.render(rootEl, params);
  rootEl.classList.add('screen-in');
  current = { name, page, params };
  window.scrollTo(0, 0);
}

export function currentScreen() {
  return current ? current.name : null;
}
