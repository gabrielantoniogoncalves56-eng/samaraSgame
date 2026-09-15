/**
 * app.js
 * Ponto de entrada. Registra todas as telas no router e inicia o app.
 */
import { initRouter, registerPage, navigate } from './core/router.js';
import { homePage } from './pages/home.js';
import { createRoomPage } from './pages/createRoom.js';
import { joinRoomPage } from './pages/joinRoom.js';
import { hostPage } from './pages/host.js';
import { lobbyPage } from './pages/lobby.js';
import { gamePage } from './pages/game.js';
import { rankingPage } from './pages/ranking.js';
import { CONFIG } from './config.js';

function boot() {
  const root = document.getElementById('app');
  initRouter(root);

  registerPage('home', homePage);
  registerPage('createRoom', createRoomPage);
  registerPage('joinRoom', joinRoomPage);
  registerPage('host', hostPage);
  registerPage('lobby', lobbyPage);
  registerPage('game', gamePage);
  registerPage('ranking', rankingPage);

  if (CONFIG.DEBUG) console.log('[GeoBattle] iniciado', CONFIG);

  navigate('home');
}

document.addEventListener('DOMContentLoaded', boot);
