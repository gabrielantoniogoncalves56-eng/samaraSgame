/**
 * gameEngine.js
 * Pequenas funções puras usadas pela tela de jogo (game.js) — mantidas
 * separadas da camada de UI para facilitar testes e reuso.
 */
export function formatSeconds(ms) {
  return Math.max(0, Math.ceil(ms / 1000));
}

export function medal(position) {
  return { 1: '🥇', 2: '🥈', 3: '🥉' }[position] || `${position}º`;
}

export function letterFor(index) {
  return ['A', 'B', 'C', 'D'][index] || '?';
}

export function difficultyLabel(diff) {
  return { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }[diff] || diff;
}

/**
 * Aguarda a disponibilidade do resultado da pergunta, tentando algumas
 * vezes — cobre o pequeno intervalo entre o envio da resposta e o
 * backend liberar o resultado (ex.: caso de corrida de rede).
 */
export async function waitForResult(fetchFn, tries = 6, delayMs = 350) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetchFn();
    } catch (e) {
      lastErr = e;
      if (e.code !== 'UNAUTHORIZED') throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
