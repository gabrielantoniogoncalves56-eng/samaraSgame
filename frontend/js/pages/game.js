/**
 * game.js — TELA 6 (Jogo) + TELA 7 (Resultado da pergunta)
 * Funciona igual para host e jogadores comuns; o host ganha o botão
 * extra "Próxima pergunta" / "Encerrar" no card de resultado.
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { apiErrorToast, toast } from '../ui/toast.js';
import { sfx } from '../ui/sound.js';
import { CountdownTimer } from '../game/timer.js';
import { RoomSync } from '../api/syncService.js';
import { setState, getState } from '../core/state.js';
import { medal, letterFor, waitForResult } from '../game/gameEngine.js';
import { flashFeedback, pulse } from '../ui/animations.js';
import { CATEGORY_ICONS } from '../data/constants.js';

let sync = null;
let timer = null;
let currentQuestionId = null;
let answered = false;
let screenRoot = null;

export const gamePage = {
  render(root, params) {
    const { session, isHost } = params;
    screenRoot = root;
    root.innerHTML = `<div class="screen screen--game" id="gameRoot"></div>`;
    loadQuestion(root, session, isHost);

    sync = new RoomSync(session, (room) => {
      setState({ room });
      // Se a sala avançou de pergunta ou terminou, o loop de resultado cuida disso.
      if (room.status === 'FINISHED' && getState().screen === 'game') {
        stopAll();
        navigate('ranking', { session });
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

async function loadQuestion(root, session, isHost) {
  answered = false;
  const gameRoot = root.querySelector('#gameRoot') || root;
  try {
    const data = await API.getQuestion({ roomCode: session.roomCode, playerId: session.playerId });
    if (!data) {
      // sala pode já ter finalizado ou mudado de status; deixa o polling reagir
      return;
    }
    currentQuestionId = data.question.id;
    sfx.questionStart();
    renderQuestion(gameRoot, session, isHost, data);
  } catch (err) {
    if (err.code === 'PLAYER_NOT_FOUND') { navigate('home'); return; }
    apiErrorToast(err);
  }
}

function renderQuestion(root, session, isHost, data) {
  const { question, index, total, timeLimit, startedAt } = data;
  const elapsedAlready = Date.now() - new Date(startedAt).getTime();
  const icon = CATEGORY_ICONS[question.category] || '🌐';

  root.innerHTML = `
    <header class="game-header">
      <span class="game-progress">Pergunta ${index + 1}/${total}</span>
      <span class="game-category">${icon} ${question.category}</span>
    </header>

    <div class="timer-ring-wrap">
      <svg class="timer-ring" viewBox="0 0 100 100">
        <circle class="timer-ring__bg" cx="50" cy="50" r="44"></circle>
        <circle class="timer-ring__fg" id="timerCircle" cx="50" cy="50" r="44"></circle>
      </svg>
      <span class="timer-ring__value" id="timerValue">${Math.ceil(timeLimit)}</span>
    </div>

    <h2 class="question-text" id="questionText">${escapeHtml(question.question)}</h2>

    <div class="answer-grid" id="answerGrid">
      ${question.alternatives.map((alt, i) => `
        <button class="answer-btn answer-btn--${letterFor(i).toLowerCase()}" data-index="${i}">
          <span class="answer-btn__letter">${letterFor(i)}</span>
          <span class="answer-btn__text">${escapeHtml(alt)}</span>
        </button>`).join('')}
    </div>

    <p class="answer-status" id="answerStatus" aria-live="polite"></p>
  `;

  const circle = root.querySelector('#timerCircle');
  const CIRC = 2 * Math.PI * 44;
  circle.style.strokeDasharray = `${CIRC}`;

  const buttons = Array.from(root.querySelectorAll('.answer-btn'));
  buttons.forEach((btn) => {
    btn.onclick = () => handleAnswer(root, session, isHost, question, Number(btn.dataset.index), timeLimit * 1000);
  });

  timer = new CountdownTimer(timeLimit * 1000, (remaining, ratio) => {
    const el = root.querySelector('#timerValue');
    if (el) el.textContent = Math.ceil(remaining / 1000);
    circle.style.strokeDashoffset = `${CIRC * (1 - ratio)}`;
    circle.classList.toggle('timer-ring__fg--danger', ratio < 0.25);
    if (Math.ceil(remaining / 1000) <= 5 && remaining > 0) sfx.tick();
  }, () => {
    if (!answered) autoTimeout(root, session, isHost, question);
  });
  timer.start(elapsedAlready);
}

async function handleAnswer(root, session, isHost, question, index, timeLimitMs) {
  if (answered) return;
  answered = true;
  timer && timer.stop();

  const buttons = Array.from(root.querySelectorAll('.answer-btn'));
  buttons.forEach((b) => { b.disabled = true; });
  buttons[index].classList.add('answer-btn--selected');
  sfx.click();
  root.querySelector('#answerStatus').textContent = 'Resposta registrada. Aguardando resultado...';

  try {
    await API.submitAnswer({ roomCode: session.roomCode, playerId: session.playerId, questionId: question.id, answer: index });
    const result = await waitForResult(() => API.getQuestionResult({ roomCode: session.roomCode, playerId: session.playerId }));
    showResult(root, session, isHost, question, result, index);
  } catch (err) {
    if (err.code === 'ALREADY_ANSWERED' || err.code === 'TIME_EXPIRED') {
      try {
        const result = await waitForResult(() => API.getQuestionResult({ roomCode: session.roomCode, playerId: session.playerId }));
        showResult(root, session, isHost, question, result, index);
        return;
      } catch (e) { /* segue para o erro genérico abaixo */ }
    }
    apiErrorToast(err);
  }
}

async function autoTimeout(root, session, isHost, question) {
  if (answered) return;
  answered = true;
  const buttons = Array.from(root.querySelectorAll('.answer-btn'));
  buttons.forEach((b) => { b.disabled = true; });
  root.querySelector('#answerStatus').textContent = 'Tempo esgotado!';
  try {
    const result = await waitForResult(() => API.getQuestionResult({ roomCode: session.roomCode, playerId: session.playerId }));
    showResult(root, session, isHost, question, result, null);
  } catch (err) {
    apiErrorToast(err);
  }
}

function showResult(root, session, isHost, question, result, chosenIndex) {
  const buttons = Array.from(root.querySelectorAll('.answer-btn'));
  buttons.forEach((btn, i) => {
    btn.classList.remove('answer-btn--selected');
    if (i === result.correctAnswer) btn.classList.add('answer-btn--correct');
    else if (i === chosenIndex) btn.classList.add('answer-btn--wrong');
  });

  if (result.ownResult) {
    flashFeedback(root, result.ownResult.correct ? 'correct' : 'wrong');
    sfx[result.ownResult.correct ? 'correct' : 'wrong']();
  }

  const podium = result.ranking.slice(0, 3);
  const podiumHtml = podium.map((p) => `
    <li class="podium-row">${medal(p.position)} <span>${escapeHtml(p.name)}</span> <strong>${p.score.toLocaleString('pt-BR')}</strong></li>
  `).join('');

  const panel = document.createElement('div');
  panel.className = 'result-panel';
  panel.innerHTML = `
    <div class="result-panel__inner">
      <p class="result-headline ${result.ownResult?.correct ? 'result-headline--ok' : 'result-headline--bad'}">
        ${result.ownResult ? (result.ownResult.correct ? `✅ Você acertou! +${result.ownResult.points} pts` : '❌ Você errou') : '⏱️ Tempo esgotado'}
      </p>
      <p class="result-explanation">${escapeHtml(question.explanation || '')}</p>
      <p class="result-meta">${result.correctCount}/${result.answeredCount} jogadores acertaram</p>
      <ol class="podium-list">${podiumHtml}</ol>
      <div class="result-actions" id="resultActions"></div>
    </div>
  `;
  root.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('result-panel--show'));
  pulse(panel);
  sfx.ranking();

  const actions = panel.querySelector('#resultActions');
  if (isHost) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-lg btn-block';
    btn.textContent = 'Próxima ➜';
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        stopAllTimersOnly();
        const room = await API.nextQuestion({ roomCode: session.roomCode, hostId: session.playerId });
        setState({ room });
        if (room.status === 'FINISHED') {
          stopAll();
          navigate('ranking', { session });
        } else {
          loadQuestion(screenRoot, session, isHost);
        }
      } catch (err) {
        apiErrorToast(err);
        btn.disabled = false;
      }
    };
    actions.appendChild(btn);
  } else {
    actions.innerHTML = `<p class="waiting-host">Aguardando o anfitrião avançar para a próxima pergunta...</p>`;
  }
}

function stopAllTimersOnly() {
  if (timer) { timer.stop(); timer = null; }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
