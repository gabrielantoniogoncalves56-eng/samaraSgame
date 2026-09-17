/**
 * ranking.js — ranking final automático, com pódio e detalhamento
 * completo da pontuação de cada jogador (A a E).
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { toast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sound.js';
import { rankPlayers } from '../game/scoring.js';
import { launchConfetti } from '../ui/animations.js';
import { clearSession } from '../core/storage.js';
import { PROFILES } from '../data/gameData.js';

export const rankingPage = {
  async render(root, params) {
    const { session } = params;
    root.innerHTML = `<div class="screen screen--ranking"><p class="loading-text">Calculando ranking final...</p></div>`;

    let room;
    try {
      room = await API.getRoom({ roomCode: session.roomCode, playerId: session.playerId });
    } catch (err) {
      toast(err.message || 'Não foi possível carregar o ranking.', 'error');
      navigate('home');
      return;
    }

    const ranking = rankPlayers(room.players);
    const [first, second, third] = ranking;
    const rest = ranking.slice(3);
    const mine = ranking.find((r) => r.player.playerId === session.playerId);

    root.innerHTML = `
      <div class="screen screen--ranking">
        <h1 class="ranking-title">${icon('trophy', { size: 22 })} Ranking Final</h1>

        <div class="podium">
          ${podiumSlot(second, 2)}
          ${podiumSlot(first, 1)}
          ${podiumSlot(third, 3)}
        </div>

        ${rest.length ? `<ol class="rest-list" start="4">
          ${rest.map((r, i) => `<li class="rest-row"><span>${i + 4}º ${escapeHtml(r.player.name)}</span><strong>${r.total} pts</strong></li>`).join('')}
        </ol>` : ''}

        <section class="panel breakdown-panel">
          <h2>${icon('calculator', { size: 16 })} Detalhamento por jogador</h2>
          <table class="breakdown-table">
            <thead><tr><th>Jogador</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>Total</th></tr></thead>
            <tbody>
              ${ranking.map((r) => `
                <tr class="${r.player.playerId === session.playerId ? 'breakdown-table__me' : ''}">
                  <td>${escapeHtml(r.player.name)}</td>
                  <td>${r.A}</td><td>${r.B}</td><td>${r.C}</td><td>${r.D}</td><td>${r.E}</td>
                  <td><strong>${r.total}</strong></td>
                </tr>`).join('')}
            </tbody>
          </table>
          <p class="rule-text breakdown-legend">A = Corredores de território · B = Bônus de território integrado ·
          C = Cartas de Perfil Migratório · D = Bônus de fluxo · E = Desafios corretos</p>
        </section>

        ${mine ? profileBreakdown(mine) : ''}

        <div class="ranking-actions">
          <button class="btn btn-primary btn-lg btn-block" id="btnNewRoom">${icon('play', { size: 18 })} Jogar Novamente</button>
          <button class="btn btn-outline btn-lg btn-block" id="btnHome">${icon('arrowLeft', { size: 16 })} Voltar ao Início</button>
        </div>
      </div>
    `;

    sfx.victory();
    launchConfetti();

    root.querySelector('#btnNewRoom').onclick = () => { clearSession(); navigate('createRoom'); };
    root.querySelector('#btnHome').onclick = () => { clearSession(); navigate('home'); };
  },
};

function podiumSlot(r, position) {
  if (!r) return `<div class="podium-slot podium-slot--${position} podium-slot--empty"></div>`;
  return `
    <div class="podium-slot podium-slot--${position}">
      <div class="podium-slot__medal">${position === 1 ? icon('crown', { size: 26 }) : position + 'º'}</div>
      <div class="podium-slot__name">${escapeHtml(r.player.name)}</div>
      <div class="podium-slot__score">${r.total} pts</div>
      <div class="podium-slot__bar"></div>
    </div>`;
}

function profileBreakdown(r) {
  return `
    <section class="panel">
      <h2>${icon('cards', { size: 16 })} Suas Cartas de Perfil</h2>
      <table class="scoring-table">
        ${PROFILES.map((p) => `<tr><td>${escapeHtml(p.name)}</td><td>${r.perProfile[p.id] || 0} pts</td></tr>`).join('')}
      </table>
    </section>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
