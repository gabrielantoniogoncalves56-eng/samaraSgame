/**
 * game.js
 * A tela principal do ROTAS online: tabuleiro interativo por jogador,
 * sorteio de tiles (substitui o saco físico), Cartas Desafio e placar
 * ao vivo calculado automaticamente a cada atualização da sala.
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { toast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sound.js';
import { CountdownTimer } from '../game/timer.js';
import { RoomSync } from '../api/syncService.js';
import { rankPlayers } from '../game/scoring.js';
import { TERRITORIES, PROFILES } from '../data/gameData.js';
import { pulse } from '../ui/animations.js';
import { openModal, closeModal } from '../ui/modal.js';
import { clearSession } from '../core/storage.js';

let sync = null;
let timer = null;
let screenRoot = null;
let session = null;
let room = null;
let viewingPlayerId = null;
let autoActing = false;

export const gamePage = {
  render(root, params) {
    session = params.session;
    screenRoot = root;
    viewingPlayerId = session.playerId;
    root.innerHTML = `<div class="screen screen--game" id="gameRoot"><p class="loading-text">Carregando sala...</p></div>`;

    sync = new RoomSync(session, (updated) => {
      const prevTurn = room ? room.currentTurnPlayerId : null;
      const prevStatus = room ? room.status : null;
      room = updated;
      const meStillHere = room.players.some((p) => p.playerId === session.playerId);
      if (!meStillHere) { stopAll(); clearSession(); toast('Você foi removido da sala.', 'error'); navigate('home'); return; }
      if (room.status === 'FINISHED') { stopAll(); navigate('ranking', { session }); return; }
      renderAll();
      if (room.currentTurnPlayerId !== prevTurn || prevStatus !== room.status) {
        if (room.currentTurnPlayerId === session.playerId) sfx.turnStart();
        restartTurnTimer();
      }
    }, () => {});
    sync.start();
  },
  destroy() { stopAll(); },
};

function stopAll() {
  if (sync) { sync.stop(); sync = null; }
  if (timer) { timer.stop(); timer = null; }
}

function me() { return room.players.find((p) => p.playerId === session.playerId); }
function viewedPlayer() { return room.players.find((p) => p.playerId === viewingPlayerId) || me(); }
function isMyTurn() { return room.currentTurnPlayerId === session.playerId; }

function renderAll() {
  const gameRoot = screenRoot.querySelector('#gameRoot');
  const turnPlayer = room.players.find((p) => p.playerId === room.currentTurnPlayerId);
  const vp = viewedPlayer();
  const leaderboard = rankPlayers(room.players);

  gameRoot.innerHTML = `
    <header class="game-topbar">
      <span class="room-code-pill">${icon('grid', { size: 13 })} ${room.roomCode}</span>
      <span class="turn-indicator ${isMyTurn() ? 'turn-indicator--mine' : ''}">
        ${isMyTurn() ? 'Sua vez!' : `Vez de ${escapeHtml(turnPlayer ? turnPlayer.name : '...')}`}
      </span>
      <div class="turn-timer-ring-wrap">
        <svg class="timer-ring" viewBox="0 0 100 100">
          <circle class="timer-ring__bg" cx="50" cy="50" r="44"></circle>
          <circle class="timer-ring__fg" id="timerCircle" cx="50" cy="50" r="44"></circle>
        </svg>
        <span class="timer-ring__value" id="timerValue">--</span>
      </div>
    </header>

    <div class="player-tabs" id="playerTabs">
      ${room.players.map((p) => `
        <button class="player-tab ${p.playerId === viewingPlayerId ? 'player-tab--active' : ''} ${p.playerId === room.currentTurnPlayerId ? 'player-tab--turn' : ''}" data-view="${p.playerId}">
          ${p.playerId === session.playerId ? 'Meu mapa' : escapeHtml(p.name)}
        </button>`).join('')}
    </div>

    <div class="board-wrap">
      <div class="board-canvas" id="boardCanvas"></div>
    </div>

    <div class="game-actions" id="gameActions"></div>

    <aside class="panel leaderboard" id="leaderboardPanel">
      <h2>${icon('trophy', { size: 16 })} Placar ao vivo</h2>
      <ol class="leaderboard-list">
        ${leaderboard.map((r, i) => `
          <li class="leaderboard-row ${r.player.playerId === room.currentTurnPlayerId ? 'leaderboard-row--turn' : ''}">
            <span class="leaderboard-row__pos">${i + 1}º</span>
            <span class="leaderboard-row__name">${escapeHtml(r.player.name)}${r.player.isHost ? icon('crown', { size: 12 }) : ''}</span>
            <span class="leaderboard-row__score">${r.total} pts</span>
          </li>`).join('')}
      </ol>
    </aside>
  `;

  renderBoard(gameRoot.querySelector('#boardCanvas'), vp);
  renderActions(gameRoot.querySelector('#gameActions'));

  gameRoot.querySelectorAll('[data-view]').forEach((btn) => {
    btn.onclick = () => { viewingPlayerId = btn.dataset.view; renderAll(); };
  });
}

// ---------------- Tabuleiro ----------------
function renderBoard(canvas, player) {
  const tiles = player.tiles || [];
  if (!tiles.length) { canvas.innerHTML = '<p class="loading-text">Sem tiles ainda.</p>'; return; }

  const own = player.playerId === session.playerId;
  const canPlace = own && isMyTurn() && !!player.pendingTile;
  const occupied = new Set(tiles.map((t) => `${t.x},${t.y}`));
  const frontier = canPlace ? computeFrontier(tiles, occupied) : new Set();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const consider = (x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
  tiles.forEach((t) => consider(t.x, t.y));
  frontier.forEach((k) => { const [x, y] = k.split(',').map(Number); consider(x, y); });

  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  canvas.style.setProperty('--cols', cols);
  canvas.style.setProperty('--rows', rows);

  const cells = [];
  tiles.forEach((t) => {
    const terr = TERRITORIES.find((x) => x.id === t.territory);
    const prof = PROFILES.find((x) => x.id === t.profile);
    cells.push(`
      <button class="board-tile board-tile--interactive" type="button"
        data-tile-info="true" data-territory="${terr.id}" data-profile="${prof.id}"
        aria-label="Ver informações de ${escapeHtml(terr.name)} e ${escapeHtml(prof.name)}"
        style="grid-column:${t.x - minX + 1}; grid-row:${t.y - minY + 1}; --tc:${terr.color}">
        <span class="board-tile__terr">${icon(terr.icon, { size: 15, strokeWidth: 1.6 })}</span>
        <span class="board-tile__prof" style="--pc:${prof.color}">${icon(prof.icon, { size: 12, strokeWidth: 1.8 })}</span>
        <span class="tile-info-badge" aria-hidden="true">i</span>
        <span class="tile-hover-card" aria-hidden="true">${escapeHtml(terr.name)}<br><strong>${escapeHtml(prof.name)}</strong><br><small>Toque para ver pontuação</small></span>
      </button>`);
  });
  frontier.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    cells.push(`<button class="board-cell board-cell--empty" data-x="${x}" data-y="${y}" style="grid-column:${x - minX + 1}; grid-row:${y - minY + 1}" aria-label="Posicionar aqui"></button>`);
  });

  canvas.innerHTML = cells.join('');
  canvas.querySelectorAll('[data-tile-info]').forEach((tile) => {
    tile.onclick = (event) => {
      event.stopPropagation();
      openTileInfo(tile.dataset.territory, tile.dataset.profile);
    };
  });

  if (canPlace) {
    canvas.querySelectorAll('.board-cell--empty').forEach((cell) => {
      cell.onclick = () => placeTile(Number(cell.dataset.x), Number(cell.dataset.y));
    });
  }
}

function computeFrontier(tiles, occupied) {
  const out = new Set();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  tiles.forEach((t) => {
    dirs.forEach(([dx, dy]) => {
      const k = `${t.x + dx},${t.y + dy}`;
      if (!occupied.has(k)) out.add(k);
    });
  });
  return out;
}

// ---------------- Ações (sortear tile / desafio) ----------------
function renderActions(container) {
  const my = me();
  if (!my) return;
  const own = viewingPlayerId === session.playerId;

  if (!own) {
    container.innerHTML = `<p class="rule-text hint-text">Visualizando o mapa de outro jogador (somente leitura).</p>`;
    return;
  }

  if (!isMyTurn()) {
    container.innerHTML = `<p class="rule-text hint-text">Aguarde sua vez para sortear e posicionar um tile.</p>`;
    return;
  }

  if (my.pendingTile) {
    const terr = TERRITORIES.find((t) => t.id === my.pendingTile.territory);
    const prof = PROFILES.find((p) => p.id === my.pendingTile.profile);
    container.innerHTML = `
      <div class="drawn-tile" style="--tc:${terr.color}">
        <span class="drawn-tile__label">Tile sorteado — toque numa célula destacada para posicionar</span>
        <button class="tile-info-button" type="button" data-tile-info="true" data-territory="${terr.id}" data-profile="${prof.id}">
          <div class="drawn-tile__preview">
            <span class="drawn-tile__terr">${icon(terr.icon, { size: 22 })} ${terr.name}</span>
            <span class="drawn-tile__prof" style="--pc:${prof.color}">${icon(prof.icon, { size: 18 })} ${prof.name}</span>
          </div>
          <span class="tile-info-button__hint">ⓘ Ver carta e pontuação</span>
        </button>
      </div>
    `;
    container.querySelector('[data-tile-info]')?.addEventListener('click', () => {
      openTileInfo(terr.id, prof.id);
    });
    return;
  }

  container.innerHTML = `
    <button class="btn btn-primary btn-lg btn-block" id="btnDraw">${icon('dice', { size: 18 })} Sortear Tile</button>
    <button class="btn btn-outline btn-block" id="btnChallenge" ${my.lastChallengeTurn === room.turnNumber ? 'disabled' : ''}>
      ${icon('target', { size: 16 })} Sortear Desafio (+3 pts)
    </button>
  `;
  container.querySelector('#btnDraw').onclick = () => drawTile();
  const chBtn = container.querySelector('#btnChallenge');
  if (chBtn) chBtn.onclick = () => openChallenge();
}

async function drawTile() {
  try {
    sfx.draw();
    await API.drawTile({ roomCode: room.roomCode, playerId: session.playerId });
    const updated = await API.getRoom({ roomCode: room.roomCode, playerId: session.playerId });
    room = updated;
    renderAll();
  } catch (err) { toast(err.message || 'Não foi possível sortear.', 'error'); }
}

async function placeTile(x, y) {
  try {
    const updated = await API.placeTile({ roomCode: room.roomCode, playerId: session.playerId, x, y });
    room = updated;
    sfx.place();
    renderAll();
    const canvas = screenRoot.querySelector('#boardCanvas');
    if (canvas) pulse(canvas);
  } catch (err) { toast(err.message || 'Não foi possível posicionar o tile.', 'error'); }
}

function openTileInfo(territoryId, profileId) {
  const terr = TERRITORIES.find((t) => t.id === territoryId);
  const prof = PROFILES.find((p) => p.id === profileId);
  if (!terr || !prof) return;
  openModal({
    title: `${icon(prof.icon, { size: 18 })} ${escapeHtml(prof.name)}`,
    bodyHtml: `
      <div class="tile-info-modal" style="--tc:${terr.color}; --pc:${prof.color}">
        <div class="tile-info-modal__section">
          <span class="tile-info-modal__label">Território</span>
          <strong>${icon(terr.icon, { size: 16 })} ${escapeHtml(terr.name)}</strong>
          <p>${escapeHtml(terr.desc)}</p>
        </div>
        <div class="tile-info-modal__section">
          <span class="tile-info-modal__label">Perfil migratório</span>
          <strong>${icon(prof.icon, { size: 16 })} ${escapeHtml(prof.name)}</strong>
          <p>${escapeHtml(prof.concept)}</p>
          <p>${escapeHtml(prof.scoring.help)}</p>
          <table class="scoring-table">${prof.scoring.table.map((row) => `<tr><td>${escapeHtml(row.k)}</td><td>${row.v} pts</td></tr>`).join('')}</table>
        </div>
      </div>`,
    actions: [{ label: 'Fechar', className: 'btn-secondary' }],
  });
}

// ---------------- Desafio ----------------
async function openChallenge() {
  try {
    const q = await API.drawChallenge({ roomCode: room.roomCode, playerId: session.playerId });
    openModal({
      title: `${icon('target', { size: 18 })} Carta Desafio`,
      bodyHtml: `
        <span class="challenge-cat">${q.category} · ${q.difficulty === 'hard' ? 'Difícil' : 'Médio'}</span>
        <p class="challenge-q">${escapeHtml(q.question)}</p>
        <div class="challenge-alts" id="challengeAlts">
          ${q.alternatives.map((a, i) => `<button class="challenge-option" data-i="${i}">${escapeHtml(a)}</button>`).join('')}
        </div>
        <div id="challengeResult"></div>
      `,
      actions: [{ label: 'Fechar', className: 'btn-secondary' }],
    });
    document.querySelectorAll('#challengeAlts .challenge-option').forEach((btn) => {
      btn.onclick = async () => {
        document.querySelectorAll('#challengeAlts .challenge-option').forEach((b) => { b.disabled = true; });
        try {
          const res = await API.answerChallenge({ roomCode: room.roomCode, playerId: session.playerId, questionId: q.id, chosenIndex: Number(btn.dataset.i) });
          document.querySelectorAll('#challengeAlts .challenge-option').forEach((b, i) => {
            if (i === res.correctAnswer) b.classList.add('challenge-option--correct');
            else if (Number(btn.dataset.i) === i) b.classList.add('challenge-option--wrong');
          });
          sfx[res.correct ? 'correct' : 'wrong']();
          document.getElementById('challengeResult').innerHTML = `
            <p class="challenge-verdict">${res.correct ? icon('check', { size: 16 }) + ' Correto! +3 pts' : icon('cross', { size: 16 }) + ' Resposta incorreta'}</p>
            <p class="challenge-explain">${escapeHtml(res.explanation)}</p>`;
          const updated = await API.getRoom({ roomCode: room.roomCode, playerId: session.playerId });
          room = updated;
          renderAll();
        } catch (err) { toast(err.message || 'Erro ao responder.', 'error'); }
      };
    });
  } catch (err) { toast(err.message || 'Não foi possível sortear um desafio.', 'error'); }
}

// ---------------- Timer de turno ----------------
function restartTurnTimer() {
  if (timer) timer.stop();
  if (!room.turnStartedAt || room.status !== 'PLAYING') return;
  const durationMs = (room.settings.turnTime || 30) * 1000;
  const elapsed = Date.now() - new Date(room.turnStartedAt).getTime();
  autoActing = false;
  timer = new CountdownTimer(durationMs, (remaining, ratio) => {
    const val = screenRoot.querySelector('#timerValue');
    const circle = screenRoot.querySelector('#timerCircle');
    if (val) val.textContent = Math.ceil(remaining / 1000);
    if (circle) {
      const CIRC = 2 * Math.PI * 44;
      circle.style.strokeDasharray = `${CIRC}`;
      circle.style.strokeDashoffset = `${CIRC * (1 - ratio)}`;
      circle.classList.toggle('timer-ring__fg--danger', ratio < 0.25);
    }
  }, () => { if (isMyTurn()) autoPlay(); });
  timer.start(Math.max(0, elapsed));
}

async function autoPlay() {
  if (autoActing) return;
  autoActing = true;
  try {
    let my = me();
    if (!my.pendingTile) {
      await API.drawTile({ roomCode: room.roomCode, playerId: session.playerId });
      const updated = await API.getRoom({ roomCode: room.roomCode, playerId: session.playerId });
      room = updated; my = me();
    }
    const occupied = new Set(my.tiles.map((t) => `${t.x},${t.y}`));
    const frontier = [...computeFrontier(my.tiles, occupied)];
    const choice = frontier[Math.floor(Math.random() * frontier.length)];
    if (choice) {
      const [x, y] = choice.split(',').map(Number);
      await placeTile(x, y);
      toast('Tempo esgotado — tile posicionado automaticamente.', 'info');
    }
  } catch (e) { /* silencioso */ }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
