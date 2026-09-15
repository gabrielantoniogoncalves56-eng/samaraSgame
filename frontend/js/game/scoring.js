/**
 * scoring.js
 * Sistema determinístico de pontuação.
 * ATENÇÃO: esta é a MESMA fórmula usada em ScoreService.gs no backend.
 * O modo mock a usa apenas para dar feedback imediato ao jogador —
 * quando conectado ao backend real, o servidor SEMPRE recalcula e é
 * a autoridade final. O cliente nunca deve ser confiável para pontuação.
 *
 * Pontuação base ao acertar: 1000
 * Bônus de velocidade: até +1500, proporcional à rapidez da resposta
 * Bônus de sequência: (streak - 1) * 100, a partir do 2º acerto seguido
 */
export function calculateScore(correct, responseMs, questionTimeMs, streak) {
  if (!correct) return 0;
  const safe = Math.max(0, Math.min(Number(responseMs) || 0, questionTimeMs));
  const speedBonus = Math.round(1500 * (1 - safe / questionTimeMs));
  const streakBonus = Math.max(0, (Number(streak) || 0) - 1) * 100;
  return Math.max(0, 1000 + speedBonus + streakBonus);
}

export function accuracy(correctCount, totalAnswered) {
  if (!totalAnswered) return 0;
  return Math.round((correctCount / totalAnswered) * 100);
}
