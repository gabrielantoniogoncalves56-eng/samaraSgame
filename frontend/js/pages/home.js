/**
 * home.js — tela inicial: hero 3D de rotas entre destinos + navegação
 * para Criar Sala, Entrar em Sala, Regras e Configurações.
 */
import { navigate } from '../core/router.js';
import { icon } from '../ui/icons.js';
import { renderHero3D, bindHeroParallax } from '../ui/heroArt.js';
import { openModal, closeModal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { GAME_META } from '../data/gameData.js';
import { tryConnectBackend, isOnlineMode, API } from '../api/api.js';
import { loadSession, clearSession } from '../core/storage.js';

let unbindParallax = null;

export const homePage = {
  render(root) {
    root.innerHTML = `
      <div class="screen screen--home">
        <header class="topbar">
          <div class="brand">${icon('route', { size: 22 })} <span>ROTAS</span></div>
          <div class="topbar__actions">
            <button class="icon-btn" id="btnSettings" aria-label="Configurações">${icon('settings', { size: 18 })}</button>
          </div>
        </header>

        <main class="home-hero">
          ${renderHero3D()}
          <h1 class="hero-title">${GAME_META.title}</h1>
          <p class="hero-subtitle">${GAME_META.subtitle}</p>
          <span class="mode-pill mode-pill--status" id="modePill">
            ${icon(isOnlineMode() ? 'wifi' : 'users', { size: 14 })}
            ${isOnlineMode() ? 'Backend conectado — multiplayer real' : 'Modo demo local (jogue sozinho contra bots)'}
          </span>

          <div class="home-actions">
            <button class="btn btn-primary btn-lg btn-block" id="btnCreate">${icon('play', { size: 18 })} Criar Sala</button>
            <button class="btn btn-outline btn-lg btn-block" id="btnJoin">${icon('users', { size: 18 })} Entrar em uma Sala</button>
          </div>

          <div class="home-links">
            <button class="link-btn" id="btnRules">${icon('book', { size: 14 })} Regras do jogo</button>
            <button class="link-btn" id="btnCreators">${icon('users', { size: 14 })} Criadores</button>
          </div>
        </main>
      </div>
    `;

    unbindParallax = bindHeroParallax(root);

    root.querySelector('#btnCreate').onclick = () => navigate('createRoom');
    root.querySelector('#btnJoin').onclick = () => navigate('joinRoom');
    root.querySelector('#btnRules').onclick = () => navigate('rules');
    root.querySelector('#btnCreators').onclick = () => openCreators();
    root.querySelector('#btnSettings').onclick = () => openSettings();

    maybeOfferReconnect();
  },
  destroy() { if (unbindParallax) unbindParallax(); },
};


function openCreators() {
  const creators = ['Bernardo Duarte', 'Danielly Tereza', 'Gabriel Antônio', 'Bernardo Alves', 'Cauan Vitor', 'Vitor Morato'];
  openModal({
    title: `${icon('users', { size: 18 })} Criadores`,
    bodyHtml: `<div class="creators-list">${creators.map((name) => `<div class="creator-row">${escapeHtml(name)}</div>`).join('')}</div>`,
    actions: [{ label: 'Fechar', className: 'btn-secondary' }],
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function openSettings() {
  openModal({
    title: `${icon('settings', { size: 18 })} Configurações`,
    bodyHtml: `
      <p>O jogo usa um backend real (Supabase) para multiplayer <strong>100% online</strong>,
      com outras pessoas em dispositivos diferentes. Você também pode jogar em
      <strong>modo demo</strong> local, sozinho contra bots, sem depender de conexão.</p>
      <p>Modo atual: <strong>${isOnlineMode() ? 'Online (Supabase)' : 'Demo (local)'}</strong></p>
    `,
    actions: [
      { label: 'Usar modo demo', className: 'btn-secondary', close: false, onClick: async () => {
        await tryConnectBackend(false);
        toast('Modo demo (local) ativado.', 'success');
        closeModal(); navigate('home');
      } },
      { label: 'Usar backend online', className: 'btn-primary', close: false, onClick: async () => {
        const result = await tryConnectBackend(true);
        toast(result.message, result.ok ? 'success' : 'error');
        closeModal(); navigate('home');
      } },
    ],
  });
}

async function maybeOfferReconnect() {
  const session = loadSession();
  if (!session || !session.roomCode) return;
  try {
    const room = await API.getRoom({ roomCode: session.roomCode, playerId: session.playerId });
    if (!room || room.status === 'FINISHED') { clearSession(); return; }
    openModal({
      title: `${icon('refresh', { size: 18 })} Reconectar`,
      bodyHtml: `<p>Encontramos uma sala em andamento: <strong>${session.roomCode}</strong> (${session.playerName}).
        Deseja voltar para o jogo?</p>`,
      actions: [
        { label: 'Ignorar', className: 'btn-secondary', onClick: () => clearSession() },
        { label: 'Reconectar', className: 'btn-primary', onClick: () => {
          if (room.status === 'WAITING') navigate('lobby', { session, reconnect: true });
          else navigate('game', { session, reconnect: true });
        } },
      ],
    });
  } catch (e) { clearSession(); }
}
