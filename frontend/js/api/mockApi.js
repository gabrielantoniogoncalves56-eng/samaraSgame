/**
 * mockApi.js
 * Implementação 100% local do jogo ROTAS — usada como modo demo (para
 * testar sozinho, com bots jogando automaticamente) e como referência
 * exata do contrato que o backend real precisa cumprir. Trocar
 * mockApi -> backendApi (veja api.js) não muda nenhuma tela.
 */
import { uid, generateRoomCode, randomTile, BOT_NAMES } from '../game/room.js';
import { isAdjacentToAny } from '../game/scoring.js';
import { CHALLENGES } from '../data/challenges.js';

const DELAY = () => 140 + Math.random() * 220;
function delay(ms = null) { return new Promise((res) => setTimeout(res, ms ?? DELAY())); }

class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function fail(code, message) { throw new ApiError(code, message); }

/** @type {Map<string, any>} */
const rooms = new Map();

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
function makePlayer(playerId, name, isHost, isBot = false) {
  return {
    playerId, name, isHost, isBot, tiles: [], pendingTile: null,
    tilesPlaced: 0, bonusScore: 0, lastChallengeTurn: 0, joinedAt: new Date().toISOString(),
  };
}
function publicRoom(room) {
  return {
    roomId: room.roomId, roomCode: room.roomCode, hostId: room.hostId, status: room.status,
    settings: room.settings, turnOrder: room.turnOrder, currentTurnPlayerId: room.currentTurnPlayerId,
    turnNumber: room.turnNumber, turnStartedAt: room.turnStartedAt,
    players: room.players.map((p) => ({ ...p, tiles: p.tiles.map((t) => ({ ...t })) })),
  };
}
function currentPlayer(room) {
  return room.players.find((p) => p.playerId === room.currentTurnPlayerId);
}
function frontierCells(tiles) {
  const occupied = new Set(tiles.map((t) => `${t.x},${t.y}`));
  const out = new Set();
  tiles.forEach((t) => {
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
      const k = `${t.x + dx},${t.y + dy}`;
      if (!occupied.has(k)) out.add(k);
    });
  });
  return [...out].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y }; });
}

function advanceTurn(room) {
  if (!room.turnOrder.length) return;
  let idx = room.turnOrder.indexOf(room.currentTurnPlayerId);
  idx = (idx + 1) % room.turnOrder.length;
  room.currentTurnPlayerId = room.turnOrder[idx];
  room.turnNumber += 1;
  room.turnStartedAt = new Date().toISOString();

  const allDone = room.players.every((p) => p.tilesPlaced >= room.settings.maxTiles);
  if (allDone) {
    room.status = 'FINISHED';
    return;
  }
  const next = currentPlayer(room);
  if (next && next.isBot) scheduleBotTurn(room);
}

function scheduleBotTurn(room) {
  const thinkMs = 900 + Math.random() * 900;
  setTimeout(() => {
    if (room.status !== 'PLAYING') return;
    const bot = currentPlayer(room);
    if (!bot || !bot.isBot) return;
    try {
      bot.pendingTile = randomTile();
      const options = frontierCells(bot.tiles);
      const choice = options[Math.floor(Math.random() * options.length)];
      if (!choice) return;
      bot.tiles.push({ x: choice.x, y: choice.y, ...bot.pendingTile });
      bot.pendingTile = null;
      bot.tilesPlaced += 1;
      advanceTurn(room);
    } catch (e) { /* ignora erro de bot */ }
  }, thinkMs);
}

export const mockApi = {
  async createRoom({ hostName, settings }) {
    await delay();
    const name = String(hostName || '').trim().slice(0, 18);
    if (!name) fail('INVALID_REQUEST', 'Nome do anfitrião é obrigatório.');
    const s = normalizeSettings(settings);

    const roomId = uid('room');
    const code = generateRoomCode(Array.from(rooms.keys()));
    const hostId = uid('host');
    const room = {
      roomId, roomCode: code, hostId, status: 'WAITING', settings: s,
      turnOrder: [], currentTurnPlayerId: null, turnNumber: 0, turnStartedAt: null,
      createdAt: new Date().toISOString(), players: [],
    };
    room.players.push(makePlayer(hostId, name, true));
    rooms.set(code, room);

    const botCount = 1 + Math.floor(Math.random() * 2);
    BOT_NAMES.filter((n) => n.toLowerCase() !== name.toLowerCase())
      .sort(() => Math.random() - 0.5).slice(0, botCount).forEach((n) => {
        room.players.push(makePlayer(uid('bot'), n, false, true));
      });

    return { room: publicRoom(room), session: { roomCode: code, playerId: hostId, playerName: name, isHost: true } };
  },

  async joinRoom({ roomCode, name }) {
    await delay();
    const code = String(roomCode || '').trim().toUpperCase();
    const cleanName = String(name || '').trim().slice(0, 18);
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) fail('INVALID_ROOM_CODE', 'Código da sala inválido.');
    if (!cleanName) fail('INVALID_REQUEST', 'Nome é obrigatório.');
    const room = byCode(code);
    if (room.status !== 'WAITING') fail('GAME_ALREADY_STARTED', 'A partida já começou.');
    if (room.players.length >= 8) fail('ROOM_FULL', 'Sala cheia.');
    if (room.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      fail('NAME_ALREADY_EXISTS', 'Seu nome já está sendo usado.');
    }
    const playerId = uid('player');
    room.players.push(makePlayer(playerId, cleanName, false));
    return { room: publicRoom(room), session: { roomCode: code, playerId, playerName: cleanName, isHost: false } };
  },

  async getRoom({ roomCode, playerId }) {
    await delay(90);
    const room = byCode(roomCode);
    if (playerId) findPlayer(room, playerId);
    return publicRoom(room);
  },

  async startGame({ roomCode, hostId }) {
    await delay();
    const room = byCode(roomCode);
    if (room.hostId !== hostId) fail('UNAUTHORIZED', 'Somente o anfitrião pode iniciar.');
    if (room.status !== 'WAITING') fail('GAME_ALREADY_STARTED', 'A partida já foi iniciada.');
    if (room.players.length < 2) fail('INVALID_REQUEST', 'É preciso ao menos 2 jogadores.');

    room.turnOrder = room.players.map((p) => p.playerId).sort(() => Math.random() - 0.5);
    room.players.forEach((p) => { p.tiles.push({ x: 0, y: 0, ...randomTile() }); p.tilesPlaced = 1; });
    room.status = 'PLAYING';
    room.currentTurnPlayerId = room.turnOrder[0];
    room.turnNumber = 1;
    room.turnStartedAt = new Date().toISOString();

    const first = currentPlayer(room);
    if (first && first.isBot) scheduleBotTurn(room);

    return publicRoom(room);
  },

  async drawTile({ roomCode, playerId }) {
    await delay(80);
    const room = byCode(roomCode);
    const player = findPlayer(room, playerId);
    if (room.status !== 'PLAYING') fail('INVALID_REQUEST', 'A partida não está em andamento.');
    if (room.currentTurnPlayerId !== playerId) fail('UNAUTHORIZED', 'Não é a sua vez.');
    if (player.pendingTile) return player.pendingTile;
    player.pendingTile = randomTile();
    return player.pendingTile;
  },

  async placeTile({ roomCode, playerId, x, y }) {
    await delay(80);
    const room = byCode(roomCode);
    const player = findPlayer(room, playerId);
    if (room.status !== 'PLAYING') fail('INVALID_REQUEST', 'A partida não está em andamento.');
    if (room.currentTurnPlayerId !== playerId) fail('UNAUTHORIZED', 'Não é a sua vez.');
    if (!player.pendingTile) fail('INVALID_REQUEST', 'Sorteie um tile antes de posicionar.');
    x = Number(x); y = Number(y);
    if (player.tiles.some((t) => t.x === x && t.y === y)) fail('INVALID_REQUEST', 'Essa posição já está ocupada.');
    if (!isAdjacentToAny(player.tiles, x, y)) fail('INVALID_REQUEST', 'O tile precisa encostar em outro já posicionado.');

    player.tiles.push({ x, y, ...player.pendingTile });
    player.pendingTile = null;
    player.tilesPlaced += 1;
    advanceTurn(room);
    return publicRoom(room);
  },

  async drawChallenge({ roomCode, playerId }) {
    await delay(100);
    const room = byCode(roomCode);
    const player = findPlayer(room, playerId);
    if (room.status !== 'PLAYING') fail('INVALID_REQUEST', 'A partida não está em andamento.');
    if (room.currentTurnPlayerId !== playerId) fail('UNAUTHORIZED', 'Só quem está no turno pode sortear um desafio.');
    if (player.lastChallengeTurn === room.turnNumber) fail('INVALID_REQUEST', 'Você já sorteou um desafio neste turno.');
    let pool = CHALLENGES;
    if (room.settings.challengeDifficulty && room.settings.challengeDifficulty !== 'all') {
      pool = pool.filter((c) => c.difficulty === room.settings.challengeDifficulty);
    }
    const q = pool[Math.floor(Math.random() * pool.length)];
    return { id: q.id, category: q.category, difficulty: q.difficulty, question: q.question, alternatives: q.alternatives };
  },

  async answerChallenge({ roomCode, playerId, questionId, chosenIndex }) {
    await delay(100);
    const room = byCode(roomCode);
    const player = findPlayer(room, playerId);
    const q = CHALLENGES.find((c) => c.id === Number(questionId));
    if (!q) fail('INVALID_REQUEST', 'Desafio não encontrado.');
    player.lastChallengeTurn = room.turnNumber;
    const correct = Number(chosenIndex) === q.correctAnswer;
    if (correct) player.bonusScore += 3;
    return { correct, correctAnswer: q.correctAnswer, explanation: q.explanation, bonusScore: player.bonusScore };
  },

  async removePlayer({ roomCode, hostId, playerId }) {
    await delay();
    const room = byCode(roomCode);
    if (room.hostId !== hostId) fail('UNAUTHORIZED', 'Somente o anfitrião pode expulsar.');
    if (playerId === room.hostId) fail('INVALID_REQUEST', 'O anfitrião não pode ser expulso.');
    room.players = room.players.filter((p) => p.playerId !== playerId);
    room.turnOrder = room.turnOrder.filter((id) => id !== playerId);
    return publicRoom(room);
  },
};

function normalizeSettings(s = {}) {
  const maxTiles = [10, 15, 20, 25].includes(Number(s.maxTiles)) ? Number(s.maxTiles) : 15;
  const turnTime = [20, 30, 45, 60].includes(Number(s.turnTime)) ? Number(s.turnTime) : 30;
  const challengeDifficulty = ['all', 'medium', 'hard'].includes(s.challengeDifficulty) ? s.challengeDifficulty : 'all';
  return { maxTiles, turnTime, challengeDifficulty };
}
