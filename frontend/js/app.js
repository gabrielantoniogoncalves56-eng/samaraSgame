/**
 * app.js — registra todas as telas do ROTAS online e inicia o app.
 */
import { initRouter, registerPage, navigate } from './core/router.js';
import { homePage } from './pages/home.js';
import { createRoomPage } from './pages/createRoom.js';
import { joinRoomPage } from './pages/joinRoom.js';
import { hostPage } from './pages/host.js';
import { lobbyPage } from './pages/lobby.js';
import { gamePage } from './pages/game.js';
import { rankingPage } from './pages/ranking.js';
import { rulesPage } from './pages/rules.js';
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
  registerPage('rules', rulesPage);

  if (CONFIG.DEBUG) console.log('[ROTAS] iniciado', CONFIG);

  navigate('home');
}

document.addEventListener('DOMContentLoaded', boot);
