/**
 * lobby.js — visão do jogador comum aguardando o anfitrião iniciar.
 */
import { navigate } from '../core/router.js';
import { RoomSync } from '../api/syncService.js';
import { API } from '../api/api.js';
import { clearSession } from '../core/storage.js';
import { toast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';

let sync = null;

export const lobbyPage = {
  render(root, params) {
    const { room, session, reconnect } = params;

    root.innerHTML = `
      <div class="screen screen--lobby">
        <header class="form-header">
          <button class="icon-btn" id="btnLeave" aria-label="Sair da sala">${icon('arrowLeft', { size: 18 })}</button>
          <h1>Lobby</h1>
        </header>

        <div class="lobby-code">
          <span class="lobby-code__label">Sala</span>
          <span class="lobby-code__value">${room.roomCode}</span>
        </div>

        <div class="lobby-wait">
          <div class="wait-spinner" aria-hidden="true"></div>
          <p class="wait-text">Aguardando o anfitrião iniciar a partida...</p>
        </div>

        <section class="panel">
          <div class="players-card__header">
            <h2>${icon('users', { size: 16 })} Jogadores</h2>
            <span class="player-count" id="playerCount">${room.players.length}</span>
          </div>
          <ul class="player-list" id="playerList"></ul>
        </section>
      </div>
    `;

    renderPlayers(root, room, session);

    root.querySelector('#btnLeave').onclick = () => { stopSync(); clearSession(); navigate('home'); };

    sync = new RoomSync(session, (updated) => {
      const meStillHere = updated.players.some((p) => p.playerId === session.playerId);
      if (!meStillHere) {
        stopSync(); clearSession();
        toast('Você foi removido da sala pelo anfitrião.', 'error');
        navigate('home');
        return;
      }
      renderPlayers(root, updated, session);
      if (updated.status === 'PLAYING') { stopSync(); navigate('game', { session, isHost: false }); }
      if (updated.status === 'FINISHED') { stopSync(); navigate('ranking', { session }); }
    }, () => {});
    sync.start();

    if (reconnect) toast('Reconectado com sucesso!', 'success');
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
    <li class="player-row ${p.playerId === session.playerId ? 'player-row--me' : ''}">
      <span class="player-row__index">${i + 1}.</span>
      <span class="player-row__name">${escapeHtml(p.name)} ${p.isHost ? icon('crown', { size: 14 }) : ''} ${p.isBot ? '<span class="bot-badge">BOT</span>' : ''}</span>
    </li>`).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
