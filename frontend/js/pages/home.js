/**
 * home.js — TELA 1: HOME
 */
import { navigate } from '../core/router.js';
import { renderGlobe, startParticleField } from '../ui/globe.js';
import { openModal, closeModal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { sfx, toggleSound } from '../ui/sound.js';
import { getState } from '../core/state.js';
import { tryConnectBackend, currentMode } from '../api/api.js';
import { CONFIG } from '../config.js';
import { loadSession, clearSession } from '../core/storage.js';
import { API } from '../api/api.js';
import { showLoading, hideLoading } from '../ui/loading.js';

let stopParticles = null;

export const homePage = {
  render(root) {
    const soundOn = getState().soundOn;
    root.innerHTML = `
      <canvas class="bg-particles"></canvas>
      <div class="screen screen--home">
        <header class="topbar">
          <div class="brand">🌎 <span>GeoBattle</span></div>
          <div class="topbar__actions">
            <button class="icon-btn" id="btnSound" aria-label="Som">${soundOn ? '🔊' : '🔇'}</button>
            <button class="icon-btn" id="btnSettings" aria-label="Configurações">⚙️</button>
          </div>
        </header>

        <main class="home-hero">
          ${renderGlobe()}
          <h1 class="hero-title">GeoBattle</h1>
          <p class="hero-subtitle">Teste seus conhecimentos. Desafie seus amigos.</p>

          <div class="home-actions">
            <button class="btn btn-primary btn-lg" id="btnCreate">🗺️ Criar Sala</button>
            <button class="btn btn-outline btn-lg" id="btnJoin">🚩 Entrar em uma Sala</button>
          </div>

          <div class="home-links">
            <button class="link-btn" id="btnHow">Como jogar</button>
            <button class="link-btn" id="btnAbout">Sobre o jogo</button>
            <span class="mode-pill" id="modePill">${currentMode() === 'backend' ? '🟢 Backend conectado' : '🟡 Modo demo (offline)'}</span>
          </div>
        </main>

        <footer class="home-footer">GeoBattle · v${CONFIG.VERSION} · Feito para geógrafos competitivos 🌋</footer>
      </div>
    `;

    const canvas = root.querySelector('.bg-particles');
    stopParticles = startParticleField(canvas);

    root.querySelector('#btnCreate').onclick = () => { sfx.click(); navigate('createRoom'); };
    root.querySelector('#btnJoin').onclick = () => { sfx.click(); navigate('joinRoom'); };
    root.querySelector('#btnSound').onclick = (e) => {
      const on = toggleSound();
      e.currentTarget.textContent = on ? '🔊' : '🔇';
    };
    root.querySelector('#btnSettings').onclick = () => openSettings();
    root.querySelector('#btnHow').onclick = () => openHowToPlay();
    root.querySelector('#btnAbout').onclick = () => openAbout();

    maybeOfferReconnect();
  },
  destroy() {
    if (stopParticles) stopParticles();
  },
};

function openHowToPlay() {
  openModal({
    title: '🎮 Como jogar',
    bodyHtml: `
      <ol class="howto-list">
        <li>Um jogador cria uma sala e escolhe as configurações da partida.</li>
        <li>O sistema gera um código de 6 caracteres para compartilhar.</li>
        <li>Os demais jogadores entram digitando o código e o nome.</li>
        <li>O anfitrião inicia a partida quando todos estiverem prontos.</li>
        <li>Todos respondem às mesmas perguntas de Geografia — quanto mais rápido e mais acertos em sequência, mais pontos!</li>
        <li>Ao final, o ranking completo e as estatísticas são exibidos.</li>
      </ol>`,
    actions: [{ label: 'Entendi', className: 'btn-primary' }],
  });
}
function openAbout() {
  openModal({
    title: '🌋 Sobre o GeoBattle',
    bodyHtml: `<p>GeoBattle é um jogo multiplayer de perguntas e respostas sobre Geografia,
      com identidade visual e arquitetura próprias. Funciona 100% offline em <strong>modo demo</strong>,
      e pode se conectar a um backend real em Google Apps Script para partidas com várias pessoas em dispositivos diferentes.</p>`,
    actions: [{ label: 'Fechar', className: 'btn-secondary' }],
  });
}

function openSettings() {
  const mode = currentMode();
  const url = CONFIG.API_BASE_URL || '';
  openModal({
    title: '⚙️ Configurações',
    bodyHtml: `
      <p class="settings-desc">O GeoBattle funciona sozinho, em <strong>modo demo</strong>, sem nenhum servidor.
      Para jogar com outras pessoas em dispositivos diferentes, cole abaixo a URL do seu
      backend (Web App do Google Apps Script) publicado. A conexão é testada e ativada automaticamente.</p>
      <label class="field-label" for="apiUrlInput">URL do backend (Web App)</label>
      <input id="apiUrlInput" class="text-input" placeholder="https://script.google.com/macros/s/.../exec" value="${url}" />
      <p class="settings-status">Status atual: <strong>${mode === 'backend' ? 'Conectado ao backend' : 'Modo demo (offline)'}</strong></p>
    `,
    actions: [
      { label: 'Usar modo demo', className: 'btn-secondary', close: false, onClick: async () => {
        await tryConnectBackend('');
        toast('Modo demo ativado.', 'success');
        closeModal();
        navigate('home');
      } },
      { label: 'Conectar', className: 'btn-primary', close: false, onClick: async () => {
        const val = document.getElementById('apiUrlInput').value;
        showLoading('Testando conexão...');
        const result = await tryConnectBackend(val);
        hideLoading();
        toast(result.message, result.ok ? 'success' : 'error');
        if (result.ok) { closeModal(); navigate('home'); }
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
      title: '🔄 Reconectar',
      bodyHtml: `<p>Encontramos uma sala em andamento: <strong>${session.roomCode}</strong> (${session.playerName}).
        Deseja voltar para o jogo?</p>`,
      actions: [
        { label: 'Ignorar', className: 'btn-secondary', onClick: () => clearSession() },
        { label: 'Reconectar', className: 'btn-primary', onClick: () => {
          navigate('lobby', { session, reconnect: true });
        } },
      ],
    });
  } catch (e) {
    clearSession();
  }
}
