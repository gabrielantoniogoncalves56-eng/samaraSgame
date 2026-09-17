/**
 * host.js — sala criada: código para compartilhar, lista de jogadores
 * em tempo real e botão para iniciar a partida.
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { toast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sound.js';
import { RoomSync } from '../api/syncService.js';
import { openModal } from '../ui/modal.js';

let sync = null;
let rootRef = null;

export const hostPage = {
  render(root, params) {
    rootRef = root;
    const { room, session } = params;

    root.innerHTML = `
      <div class="screen screen--host">
        <header class="form-header">
          <button class="icon-btn" id="btnBack" aria-label="Cancelar sala">${icon('arrowLeft', { size: 18 })}</button>
          <h1>Sala Criada</h1>
        </header>

        <section class="code-card">
          <p class="code-label">CÓDIGO DA SALA</p>
          <div class="code-display">${room.roomCode}</div>
          <div class="code-actions">
            <button class="btn btn-secondary" id="btnCopy">${icon('copy', { size: 16 })} Copiar Código</button>
            <button class="btn btn-secondary" id="btnShare">${icon('share', { size: 16 })} Compartilhar</button>
          </div>
        </section>

        <section class="panel">
          <div class="players-card__header">
            <h2>${icon('users', { size: 16 })} Jogadores conectados</h2>
            <span class="player-count" id="playerCount">${room.players.length}</span>
          </div>
          <ul class="player-list" id="playerList"></ul>
        </section>

        <button class="btn btn-primary btn-lg btn-block" id="btnStart" ${room.players.length < 2 ? 'disabled' : ''}>
          ${icon('play', { size: 18 })} Iniciar Partida
        </button>
        <p class="rule-text hint-text">Mínimo de 2 jogadores para iniciar.</p>
      </div>
    `;

    renderPlayers(root, room, session);

    root.querySelector('#btnBack').onclick = () => { stopSync(); navigate('home'); };
    root.querySelector('#btnCopy').onclick = () => {
      navigator.clipboard?.writeText(room.roomCode).then(() => toast('Código copiado!', 'success'));
      sfx.click();
    };
    root.querySelector('#btnShare').onclick = async () => {
      sfx.click();
      const text = `Entre na minha sala do ROTAS! Código: ${room.roomCode}`;
      if (navigator.share) { try { await navigator.share({ title: 'ROTAS', text }); } catch (e) { /* cancelado */ } }
      else { navigator.clipboard?.writeText(text); toast('Convite copiado!', 'success'); }
    };
    root.querySelector('#btnStart').onclick = async () => {
      sfx.click();
      try {
        await API.startGame({ roomCode: room.roomCode, hostId: session.playerId });
        stopSync();
        navigate('game', { session, isHost: true });
      } catch (err) {
        toast(err.message || 'Não foi possível iniciar.', 'error');
      }
    };

    sync = new RoomSync(session, (updated) => {
      renderPlayers(root, updated, session);
      const startBtn = root.querySelector('#btnStart');
      if (startBtn) startBtn.disabled = updated.players.length < 2;
      if (updated.status === 'PLAYING') { stopSync(); navigate('game', { session, isHost: session.isHost }); }
    }, () => {});
    sync.start();
  },
  destroy() { stopSync(); },
};

function stopSync() { if (sync) { sync.stop(); sync = null; } }

function renderPlayers(root, room, session) {
  const list = root.querySelector('#playerList');
  const count = root.querySelector('#playerCount');
  if (!list) return;
  count.textContent = room.players.length;
  list.innerHTML = room.players.map((p, i) => `
    <li class="player-row">
      <span class="player-row__index">${i + 1}.</span>
      <span class="player-row__name">${escapeHtml(p.name)} ${p.isHost ? icon('crown', { size: 14 }) : ''} ${p.isBot ? '<span class="bot-badge">BOT</span>' : ''}</span>
      ${!p.isHost ? `<button class="icon-btn icon-btn--danger" data-kick="${p.playerId}" aria-label="Remover ${escapeHtml(p.name)}">${icon('close', { size: 14 })}</button>` : ''}
    </li>`).join('');

  list.querySelectorAll('[data-kick]').forEach((btn) => {
    btn.onclick = () => confirmKick(room, session, btn.dataset.kick);
  });
}

function confirmKick(room, session, playerId) {
  const player = room.players.find((p) => p.playerId === playerId);
  openModal({
    title: 'Remover jogador',
    bodyHtml: `<p>Tem certeza que deseja remover <strong>${escapeHtml(player?.name || '')}</strong> da sala?</p>`,
    actions: [
      { label: 'Cancelar', className: 'btn-secondary' },
      { label: 'Remover', className: 'btn-danger', onClick: async () => {
        try {
          const updated = await API.removePlayer({ roomCode: room.roomCode, hostId: session.playerId, playerId });
          toast('Jogador removido.', 'info');
          if (rootRef) renderPlayers(rootRef, updated, session);
        } catch (err) { toast(err.message || 'Erro ao remover jogador.', 'error'); }
      } },
    ],
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
