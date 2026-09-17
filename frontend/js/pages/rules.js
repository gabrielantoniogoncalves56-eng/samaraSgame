/**
 * rules.js — regras do ROTAS 100% online.
 */
import { navigate } from '../core/router.js';
import { icon } from '../ui/icons.js';
import { TERRITORIES, PROFILES, GAME_META, PEDAGOGICAL_MAP } from '../data/gameData.js';

export const rulesPage = {
  render(root) {
    root.innerHTML = `
      <div class="screen screen--rules">
        <header class="form-header">
          <button class="icon-btn" id="btnBack" aria-label="Voltar">${icon('arrowLeft', { size: 18 })}</button>
          <h1>Regras — ${GAME_META.title}</h1>
        </header>

        <section class="panel">
          <h2>${icon('info', { size: 16 })} Visão geral</h2>
          <p class="rule-text">Cada jogador constrói, sozinho, seu próprio mapa de fluxos migratórios,
          sorteando e posicionando tiles de território e migrante. A pontuação é calculada
          automaticamente pelo sistema, em tempo real, a cada tile posicionado. Vence quem
          somar mais pontos ao final.</p>
          <div class="hero-meta">
            <span class="mode-pill">${icon('users', { size: 14 })} ${GAME_META.players}</span>
            <span class="mode-pill">${icon('info', { size: 14 })} ${GAME_META.duration}</span>
          </div>
        </section>

        <section class="panel">
          <h2>${icon('grid', { size: 16 })} Territórios</h2>
          <div class="concept-grid">
            ${TERRITORIES.map((t) => `
              <div class="concept-card" style="--c:${t.color}">
                <div class="concept-card__head">
                  <span class="concept-card__icon">${icon(t.icon, { size: 20 })}</span>
                  <span class="concept-card__name">${t.name}</span>
                </div>
                <span class="concept-card__desc">${t.desc}</span>
              </div>`).join('')}
          </div>
        </section>

        <section class="panel">
          <h2>${icon('play', { size: 16 })} Como jogar (turno online)</h2>
          <ol class="rule-list">
            <li>Ao entrar na sala, você recebe automaticamente um tile inicial no centro do seu mapa.</li>
            <li>Na sua vez, toque em <strong>Sortear Tile</strong> — o sistema sorteia um território e
            um perfil migratório aleatórios (substituindo o saco físico por uma função de sorteio).</li>
            <li>Toque em uma das células destacadas do seu mapa (adjacente a um tile já colocado) para
            posicionar o tile sorteado.</li>
            <li>Sua pontuação é recalculada automaticamente e aparece no placar ao vivo.</li>
            <li>O turno passa para o próximo jogador. Cada turno tem um tempo limite — se esgotar, o
            sistema sorteia e posiciona automaticamente por você.</li>
            <li>A partida termina quando todos os jogadores atingirem o número de tiles definido pelo
            anfitrião na criação da sala.</li>
          </ol>
        </section>

        <section class="panel">
          <h2>${icon('target', { size: 16 })} Cartas Desafio</h2>
          <p class="rule-text">Durante sua vez, você pode tocar em <strong>Sortear Desafio</strong> (uma
          vez por turno) para responder uma pergunta sobre migração. Acertar rende
          <strong>+3 pontos-bônus</strong>. As perguntas têm dois níveis de dificuldade (médio e
          difícil), configuráveis pelo anfitrião ao criar a sala.</p>
        </section>

        <section class="panel">
          <h2>${icon('cards', { size: 16 })} Cartas de Perfil Migratório</h2>
          <p class="rule-text">Cada perfil pontua de um jeito diferente — tudo calculado automaticamente
          pelo sistema conforme você posiciona os tiles.</p>
          <div class="profile-list">
            ${PROFILES.map((p) => `
              <div class="profile-card" style="--c:${p.color}">
                <div class="profile-card__head">
                  <span class="profile-card__icon">${icon(p.icon, { size: 26 })}</span>
                  <div>
                    <div class="profile-card__name">${p.name}</div>
                    <div class="profile-card__concept">${p.concept}</div>
                  </div>
                </div>
                <p class="profile-card__flavor">${p.flavor}</p>
                <p class="profile-card__help">${p.scoring.help}</p>
                <table class="scoring-table">
                  ${p.scoring.table.map((row) => `<tr><td>${row.k}</td><td>${row.v} pts</td></tr>`).join('')}
                </table>
              </div>`).join('')}
          </div>
        </section>

        <section class="panel">
          <h2>${icon('trophy', { size: 16 })} Pontuação final</h2>
          <p class="rule-text"><strong>A) Corredores de Território</strong> — maior grupo conectado de
          cada território no seu mapa. 1 ponto por tile.</p>
          <p class="rule-text"><strong>B) Bônus de Território Integrado</strong> — quem tiver o maior
          corredor da sala em cada território ganha +3 pts (empate: ninguém pontua).</p>
          <p class="rule-text"><strong>C) Cartas de Perfil Migratório</strong> — soma das 5 cartas.</p>
          <p class="rule-text"><strong>D) Bônus de Fluxo</strong> — quem tiver o maior grupo conectado de
          cada perfil na sala ganha +3 pts (empate: ninguém pontua).</p>
          <p class="rule-text"><strong>E) Desafios corretos</strong> — +3 pts cada.</p>
          <p class="rule-text rule-highlight">Total = A + B + C + D + E. Tudo calculado automaticamente —
          o ranking final aparece assim que a partida termina.</p>
        </section>

        <section class="panel">
          <h2>${icon('book', { size: 16 })} Por que funciona pedagogicamente</h2>
          <table class="pedagogic-table">
            <thead><tr><th>Mecânica</th><th>Conceito de Geografia</th></tr></thead>
            <tbody>
              ${PEDAGOGICAL_MAP.map((row) => `<tr><td>${row.mechanic}</td><td>${row.concept}</td></tr>`).join('')}
            </tbody>
          </table>
        </section>
      </div>
    `;

    root.querySelector('#btnBack').onclick = () => navigate('home');
  },
};
