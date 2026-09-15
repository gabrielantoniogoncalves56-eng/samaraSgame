/**
 * mockApi.js
 * Implementação 100% local (sem rede) de toda a API do GeoBattle.
 * Espelha EXATAMENTE o contrato e os códigos de erro do backend real
 * (Google Apps Script) para que trocar mockApi -> backendApi não exija
 * nenhuma mudança na interface.
 *
 * Também simula jogadores-bot para demonstrar a experiência multiplayer
 * sem precisar de um segundo dispositivo.
 */
import { QUESTIONS } from '../data/questions.js';
import { generateRoomCode, uid, BOT_NAMES } from '../game/room.js';
import { calculateScore } from '../game/scoring.js';

const DELAY_MIN = 180;
const DELAY_MAX = 420;

/** @type {Map<string, any>} roomCode -> room */
const rooms = new Map();
/** roomId -> array de respostas */
const answersByRoom = new Map();

function delay(ms = null) {
  const t = ms ?? (DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
  return new Promise((res) => setTimeout(res, t));
}

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fail(code, message) {
  throw new ApiError(code, message);
}

function byCode(code) {
  const room = rooms.get(String(code || '').toUpperCase());
  if (!room) fail('ROOM_NOT_FOUND', 'Sala não encontrada.');
  return room;
}
function findPlayer(room, playerId) {
  const p = room.players.find((x) => x.playerId === playerId);
  if (!p) fail('PLAYER_NOT_FOUND', 'Jogador não encontrado.');
  return p;
}
function pickQuestions(settings) {
  let pool = QUESTIONS.slice();
  if (settings.categories && settings.categories.length) {
    pool = pool.filter((q) => settings.categories.includes(q.category));
  }
  if (settings.difficulty && settings.difficulty !== 'random') {
    pool = pool.filter((q) => q.difficulty === settings.difficulty);
  }
  if (pool.length < settings.questionCount) pool = QUESTIONS.slice(); // fallback: sem perguntas suficientes
  pool = pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, settings.questionCount).map((q) => q.id);
}
function questionById(id) {
  return QUESTIONS.find((q) => q.id === id);
}
function publicRoom(room) {
  return {
    roomId: room.roomId,
    roomCode: room.roomCode,
    hostId: room.hostId,
    status: room.status,
    settings: room.settings,
    players: room.players.map((p) => ({ ...p })),
    currentQuestion: room.currentQuestion,
    questionIndex: room.questionIndex,
    totalQuestions: room.questionIds.length,
    questionStartedAt: room.questionStartedAt,
  };
}

function hasAnswered(room, playerId, questionId) {
  const list = answersByRoom.get(room.roomId) || [];
  return list.some((a) => a.playerId === playerId && a.questionId === questionId);
}

// ---------- Simulação de bots ----------
function scheduleBotAnswers(room) {
  const q = questionById(room.currentQuestion);
  if (!q) return;
  const limitMs = Number(room.settings.questionTime) * 1000;
  room.players
    .filter((p) => p.isBot && p.alive !== false)
    .forEach((bot) => {
      const thinkMs = 900 + Math.random() * Math.max(500, limitMs - 1500);
      const willBeCorrect = Math.random() < (0.45 + skillFor(bot));
      setTimeout(() => {
        if (room.status !== 'QUESTION' || room.currentQuestion !== q.id) return;
        if (hasAnswered(room, bot.playerId, q.id)) return;
        const answer = willBeCorrect
          ? q.correctAnswer
          : (q.correctAnswer + 1 + Math.floor(Math.random() * 3)) % 4;
        try {
          internalSubmitAnswer(room, bot.playerId, q.id, answer, thinkMs);
        } catch (e) { /* ignore erros de bot */ }
      }, Math.min(thinkMs, limitMs - 200));
    });
}
function skillFor(bot) {
  return bot._skill ?? (bot._skill = Math.random() * 0.35);
}

function internalSubmitAnswer(room, playerId, questionId, answer, forcedElapsedMs = null) {
  const player = findPlayer(room, playerId);
  if (room.status !== 'QUESTION') fail('INVALID_REQUEST', 'A partida não está em uma pergunta.');
  if (player.alive === false) fail('PLAYER_NOT_FOUND', 'Jogador eliminado.');
  const q = questionById(room.currentQuestion);
  if (!q || Number(questionId) !== q.id) fail('INVALID_QUESTION', 'Esta não é a pergunta atual.');
  if (hasAnswered(room, playerId, q.id)) fail('ALREADY_ANSWERED', 'Você já respondeu essa pergunta.');

  const limitMs = Number(room.settings.questionTime) * 1000;
  const elapsed = forcedElapsedMs ?? (Date.now() - new Date(room.questionStartedAt).getTime());
  if (elapsed > limitMs + 250) fail('TIME_EXPIRED', 'Tempo esgotado.');

  const correct = Number(answer) === q.correctAnswer;
  const nextStreak = correct ? (player.streak || 0) + 1 : 0;
  const points = calculateScore(correct, elapsed, limitMs, nextStreak);

  const list = answersByRoom.get(room.roomId) || [];
  list.push({
    answerId: uid('answer'), roomId: room.roomId, playerId, questionId: q.id,
    answer: Number(answer), correct, responseTime: elapsed, points, timestamp: Date.now(),
  });
  answersByRoom.set(room.roomId, list);

  player.score = (player.score || 0) + points;
  player.streak = nextStreak;
  player.maxStreak = Math.max(player.maxStreak || 0, nextStreak);
  player.correctAnswers = (player.correctAnswers || 0) + (correct ? 1 : 0);
  player.wrongAnswers = (player.wrongAnswers || 0) + (correct ? 0 : 1);
  player.responseTimes = player.responseTimes || [];
  player.responseTimes.push(elapsed);

  if (!correct && room.settings.mode === 'survival') {
    const wrongCount = player.wrongAnswers;
    player.alive = wrongCount < 3;
  }
  return { accepted: true, record: { playerId, questionId: q.id, correct, points, responseTime: elapsed } };
}

// ---------------- API pública (mesmo contrato do backend) ----------------

export const mockApi = {
  async createRoom({ hostName, settings }) {
    await delay();
    const name = String(hostName || '').trim().slice(0, 18);
    if (!name) fail('INVALID_REQUEST', 'Nome do anfitrião é obrigatório.');
    const s = normalizeSettings(settings);
    const questionIds = pickQuestions(s);
    if (!questionIds.length) fail('INVALID_REQUEST', 'Nenhuma pergunta atende aos filtros.');

    const roomId = uid('room');
    const code = generateRoomCode(Array.from(rooms.keys()));
    const hostId = uid('host');
    const room = {
      roomId, roomCode: code, hostId, status: 'WAITING', settings: s,
      questionIds, currentQuestion: null, questionIndex: 0, questionStartedAt: null,
      createdAt: new Date().toISOString(), players: [],
    };
    room.players.push(makePlayer(hostId, name, true));
    rooms.set(code, room);
    answersByRoom.set(roomId, []);

    // adiciona bots automaticamente para demonstrar o multiplayer
    seedBots(room);

    return { room: publicRoom(room), session: { roomCode: code, playerId: hostId, playerName: name, isHost: true } };
  },

  async joinRoom({ roomCode, name }) {
    await delay();
    const code = String(roomCode || '').trim().toUpperCase();
    const cleanName = String(name || '').trim().slice(0, 18);
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) fail('INVALID_ROOM_CODE', 'Código da sala inválido.');
    if (!cleanName) fail('INVALID_REQUEST', 'Nome é obrigatório.');
    const room = byCode(code);
    if (room.players.filter((p) => !p.isBot).length >= 40) fail('ROOM_FULL', 'Sala cheia.');
    if (room.status !== 'WAITING' && !room.settings.allowLateJoin) {
      fail('GAME_ALREADY_STARTED', 'A partida já começou.');
    }
    if (room.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      fail('NAME_ALREADY_EXISTS', 'Seu nome já está sendo usado.');
    }
    const playerId = uid('player');
    room.players.push(makePlayer(playerId, cleanName, false));
    return { room: publicRoom(room), session: { roomCode: code, playerId, playerName: cleanName, isHost: false } };
  },

  async getRoom({ roomCode, playerId }) {
    await delay(120);
    const room = byCode(roomCode);
    if (playerId) findPlayer(room, playerId);
    return publicRoom(room);
  },

  async startGame({ roomCode, hostId }) {
    await delay();
    const room = byCode(roomCode);
    if (room.hostId !== hostId) fail('UNAUTHORIZED', 'Somente o anfitrião pode iniciar.');
    if (room.status !== 'WAITING') fail('GAME_ALREADY_STARTED', 'A partida já foi iniciada.');
    if (!room.questionIds.length) fail('INVALID_REQUEST', 'A sala não possui perguntas.');
    room.status = 'QUESTION';
    room.questionIndex = 0;
    room.currentQuestion = room.questionIds[0];
    room.questionStartedAt = new Date().toISOString();
    scheduleBotAnswers(room);
    return publicRoom(room);
  },

  async getQuestion({ roomCode, playerId }) {
    await delay(100);
    const room = byCode(roomCode);
    findPlayer(room, playerId);
    if (room.status !== 'QUESTION') return null;
    const q = questionById(room.currentQuestion);
    return {
      index: room.questionIndex,
      total: room.questionIds.length,
      question: { id: q.id, category: q.category, difficulty: q.difficulty, question: q.question, alternatives: q.alternatives },
      startedAt: room.questionStartedAt,
      timeLimit: room.settings.questionTime,
    };
  },

  async submitAnswer({ roomCode, playerId, questionId, answer }) {
    await delay(60);
    const room = byCode(roomCode);
    return internalSubmitAnswer(room, playerId, Number(questionId), Number(answer));
  },

  async getQuestionResult({ roomCode, playerId }) {
    await delay(150);
    const room = byCode(roomCode);
    findPlayer(room, playerId);
    const q = questionById(room.currentQuestion);
    const list = (answersByRoom.get(room.roomId) || []).filter((a) => a.questionId === q.id);
    const ranking = room.players
      .slice()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p, i) => ({ position: i + 1, playerId: p.playerId, name: p.name, score: p.score || 0 }));
    const own = list.find((a) => a.playerId === playerId);
    return {
      questionId: q.id,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      correctCount: list.filter((a) => a.correct).length,
      answeredCount: list.length,
      ownResult: own ? { playerId: own.playerId, correct: own.correct, points: own.points } : null,
      ranking,
    };
  },

  async leaderboard({ roomCode, playerId }) {
    await delay(120);
    const room = byCode(roomCode);
    findPlayer(room, playerId);
    const list = answersByRoom.get(room.roomId) || [];
    return room.players
      .slice()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p, i) => {
        const mine = list.filter((a) => a.playerId === p.playerId);
        const correct = mine.filter((a) => a.correct).length;
        const avgResp = mine.length
          ? Math.round(mine.reduce((s, a) => s + a.responseTime, 0) / mine.length) : 0;
        return {
          position: i + 1, playerId: p.playerId, name: p.name, score: p.score || 0,
          correctAnswers: correct, wrongAnswers: mine.length - correct,
          maxStreak: p.maxStreak || 0,
          accuracy: mine.length ? Math.round((correct / mine.length) * 100) : 0,
          avgResponse: avgResp, alive: p.alive !== false,
        };
      });
  },

  async nextQuestion({ roomCode, hostId }) {
    await delay();
    const room = byCode(roomCode);
    if (room.hostId !== hostId) fail('UNAUTHORIZED', 'Somente o anfitrião pode avançar.');
    if (room.status !== 'QUESTION') fail('INVALID_REQUEST', 'Estado inválido.');
    if (room.questionIndex >= room.questionIds.length - 1) {
      await this.finishGame({ roomCode, hostId });
      return publicRoom(room);
    }
    room.questionIndex += 1;
    room.currentQuestion = room.questionIds[room.questionIndex];
    room.questionStartedAt = new Date().toISOString();
    room.status = 'QUESTION';
    scheduleBotAnswers(room);
    return publicRoom(room);
  },

  async finishGame({ roomCode, hostId }) {
    await delay();
    const room = byCode(roomCode);
    if (room.hostId !== hostId) fail('UNAUTHORIZED', 'Somente o anfitrião pode encerrar.');
    room.status = 'FINISHED';
    room.currentQuestion = null;
    return publicRoom(room);
  },

  async removePlayer({ roomCode, hostId, playerId }) {
    await delay();
    const room = byCode(roomCode);
    if (room.hostId !== hostId) fail('UNAUTHORIZED', 'Somente o anfitrião pode expulsar.');
    if (playerId === room.hostId) fail('INVALID_REQUEST', 'O anfitrião não pode ser expulso.');
    room.players = room.players.filter((p) => p.playerId !== playerId);
    return publicRoom(room);
  },
};

function normalizeSettings(s = {}) {
  const count = [5, 10, 15, 20].includes(Number(s.questionCount)) ? Number(s.questionCount) : 10;
  const time = [10, 20, 30, 45, 60].includes(Number(s.questionTime)) ? Number(s.questionTime) : 30;
  const mode = ['classic', 'survival', 'time', 'training'].includes(s.mode) ? s.mode : 'classic';
  return {
    mode, difficulty: s.difficulty || 'random', questionCount: count, questionTime: time,
    categories: Array.isArray(s.categories) ? s.categories : [],
    allowLateJoin: !!s.allowLateJoin,
    showExplanations: s.showExplanations !== false,
    soundEnabled: s.soundEnabled !== false,
  };
}
function makePlayer(playerId, name, isHost, isBot = false) {
  return {
    playerId, name, score: 0, streak: 0, maxStreak: 0, alive: true, isHost,
    isBot, joinedAt: new Date().toISOString(), correctAnswers: 0, wrongAnswers: 0, responseTimes: [],
  };
}
function seedBots(room) {
  const count = 2 + Math.floor(Math.random() * 3); // 2 a 4 bots
  const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, count);
  names.forEach((n) => {
    room.players.push(makePlayer(uid('bot'), n, false, true));
  });
}
