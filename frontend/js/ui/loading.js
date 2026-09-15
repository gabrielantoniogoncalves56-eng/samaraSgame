/**
 * loading.js
 * Overlay de carregamento global (spinner + globo girando em miniatura).
 */
let el = null;
let count = 0;

function ensure() {
  if (!el) {
    el = document.createElement('div');
    el.className = 'loading-overlay';
    el.innerHTML = `
      <div class="mini-globe" aria-hidden="true">
        <div class="mini-globe__sphere"></div>
      </div>
      <p class="loading-text">Carregando...</p>
    `;
    document.body.appendChild(el);
  }
  return el;
}

export function showLoading(text = 'Carregando...') {
  count += 1;
  const node = ensure();
  node.querySelector('.loading-text').textContent = text;
  node.classList.add('loading-overlay--show');
}

export function hideLoading() {
  count = Math.max(0, count - 1);
  if (count === 0 && el) el.classList.remove('loading-overlay--show');
}

export async function withLoading(text, fn) {
  showLoading(text);
  try {
    return await fn();
  } finally {
    hideLoading();
  }
}
