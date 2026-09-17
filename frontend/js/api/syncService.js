/**
 * syncService.js
 * Isola a sincronização "tempo real" via polling — Apps Script não tem
 * WebSocket nativo. Substituível por WebSocket/SSE no futuro sem tocar
 * em nenhuma tela.
 */
import { API } from './api.js';

const FAST = 1200;
const SLOW = 3500;

export class RoomSync {
  constructor(session, onUpdate, onError) {
    this.session = session;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.timer = null;
    this.stopped = true;
    this.lastSignature = '';
  }
  start() { this.stopped = false; this.tick(); }
  stop() { this.stopped = true; if (this.timer) clearTimeout(this.timer); }

  async tick() {
    if (this.stopped) return;
    try {
      const room = await API.getRoom({ roomCode: this.session.roomCode, playerId: this.session.playerId });
      const sig = JSON.stringify({
        status: room.status, turn: room.currentTurnPlayerId, turnNumber: room.turnNumber,
        players: room.players.map((p) => `${p.playerId}:${p.tilesPlaced}:${p.bonusScore}`).join(','),
      });
      if (sig !== this.lastSignature) { this.lastSignature = sig; this.onUpdate(room); }
    } catch (e) {
      this.onError && this.onError(e);
    } finally {
      if (!this.stopped) {
        const interval = document.hidden ? SLOW : FAST;
        this.timer = setTimeout(() => this.tick(), interval);
      }
    }
  }
}
