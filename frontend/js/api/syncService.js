/**
 * syncService.js
 * Isola toda a lógica de "tempo real" via polling inteligente.
 * Google Apps Script não tem WebSocket nativo — por isso consultamos o
 * backend periodicamente. Esta camada pode ser substituída no futuro
 * por WebSocket/SSE sem que nenhuma tela precise mudar.
 */
import { CONFIG } from '../config.js';
import { API } from '../api/api.js';

export class RoomSync {
  /**
   * @param {{roomCode:string, playerId:string}} session
   * @param {(room:any)=>void} onUpdate
   * @param {(err:any)=>void} onError
   */
  constructor(session, onUpdate, onError) {
    this.session = session;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.timer = null;
    this.stopped = true;
    this.lastSignature = '';
  }

  start() {
    this.stopped = false;
    this.tick();
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  async tick() {
    if (this.stopped) return;
    try {
      const room = await API.getRoom({ roomCode: this.session.roomCode, playerId: this.session.playerId });
      const sig = JSON.stringify({
        status: room.status, idx: room.questionIndex, players: room.players.length,
        scores: room.players.map((p) => p.score).join(','),
      });
      if (sig !== this.lastSignature) {
        this.lastSignature = sig;
        this.onUpdate(room);
      }
    } catch (e) {
      this.onError && this.onError(e);
    } finally {
      if (!this.stopped) {
        const interval = document.hidden ? CONFIG.POLLING_INTERVAL_BACKGROUND : CONFIG.POLLING_INTERVAL;
        this.timer = setTimeout(() => this.tick(), interval);
      }
    }
  }
}
