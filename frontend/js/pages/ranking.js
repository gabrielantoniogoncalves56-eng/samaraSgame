/**
 * ranking.js — TELA 8: RANKING FINAL
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { apiErrorToast } from '../ui/toast.js';
import { sfx } from '../ui/sound.js';
import { medal } from '../game/gameEngine.js';
import { launchConfetti } from '../ui/animations.js';
import { clearSession } from '../core/storage.js';
import { withLoading } from '../ui/loading.js';

export const rankingPage = {
  async render(root, params) {
    const { session } = params;
    root.innerHTML = `<div class="screen screen--ranking"><p class="loading-text">Calculando ranking final...</p></div>`;

    let leaderboard;
    try {
      leaderboard = await withLoading('Calculando ranking final...', () =>
        API.leaderboard({ roomCode: session.roomCode, playerId: session.playerId }));
    } catch (err) {
      apiErrorToast(err);
      navigate('home');
      return;
    }

    const [first, second, third] = leaderboard;
    const rest = leaderboard.slice(3);
    const me = leaderboard.find((p) => p.playerId === session.playerId);

    root.innerHTML = `
      <div class="screen screen--ranking">
        <h1 class="ranking-title">🏆 Ranking Final</h1>

        <div class="podium">
          ${podiumSlot(second, 2)}
          ${podiumSlot(first, 1)}
          ${podiumSlot(third, 3)}
        </div>

        ${rest.length ? `<ol class="rest-list" start="4">
          ${rest.map((p) => `<li class="rest-row"><span>${p.position}º ${escapeHtml(p.name)}</span><strong>${p.score.toLocaleString('pt-BR')}</strong></li>`).join('')}
        </ol>` : ''}

        ${me ? `
        <section class="stats-card">
          <h2>Suas estatísticas</h2>
          <div class="stats-grid">
            <div class="stat"><span class="stat__value">${me.score.toLocaleString('pt-BR')}</span><span class="stat__label">Pontuação</span></div>
            <div class="stat"><span class="stat__value">${me.correctAnswers}</span><span class="stat__label">Acertos</span></div>
            <div class="stat"><span class="stat__value">${me.wrongAnswers}</span><span class="stat__label">Erros</span></div>
            <div class="stat"><span class="stat__value">${me.accuracy}%</span><span class="stat__label">Aproveitamento</span></div>
            <div class="stat"><span class="stat__value">${me.maxStreak}</span><span class="stat__label">Melhor sequência</span></div>
            <div class="stat"><span class="stat__value">${(me.avgResponse / 1000).toFixed(1)}s</span><span class="stat__label">Tempo médio</span></div>
          </div>
        </section>` : ''}

        <div class="ranking-actions">
          <button class="btn btn-primary btn-lg btn-block" id="btnNewRoom">🗺️ Nova Sala</button>
          <button class="btn btn-outline btn-lg btn-block" id="btnHome">🏠 Voltar ao Início</button>
        </div>
      </div>
    `;

    sfx.victory();
    launchConfetti();

    root.querySelector('#btnNewRoom').onclick = () => { clearSession(); navigate('createRoom'); };
    root.querySelector('#btnHome').onclick = () => { clearSession(); navigate('home'); };
  },
};

function podiumSlot(player, position) {
  if (!player) return `<div class="podium-slot podium-slot--${position} podium-slot--empty"></div>`;
  return `
    <div class="podium-slot podium-slot--${position}">
      <div class="podium-slot__medal">${medal(position)}</div>
      <div class="podium-slot__name">${escapeHtml(player.name)}</div>
      <div class="podium-slot__score">${player.score.toLocaleString('pt-BR')}</div>
      <div class="podium-slot__bar"></div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
