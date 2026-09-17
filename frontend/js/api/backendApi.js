/**
 * backendApi.js
 * Cliente do backend real — Supabase (Postgres + RPCs via PostgREST).
 * Implementa exatamente o mesmo contrato do mockApi.js (veja api.js
 * para a troca automática entre os dois), só que agora cada método
 * mapeia direto para uma função `rotas_*` no banco (SECURITY DEFINER,
 * com locking via FOR UPDATE nas escritas concorrentes).
 *
 * Toda a lógica de validação e regras do jogo vive nas RPCs — este
 * arquivo só traduz nomes de parâmetros (camelCase -> p_snake_case) e
 * decodifica erros no formato "CODIGO|mensagem" que as funções lançam.
 */
import { CONFIG } from '../config.js';

class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function rpc(fn, params = {}) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(params),
    });
  } catch (e) {
    throw new ApiError('SERVER_ERROR', 'Não foi possível conectar ao backend.');
  }

  let json = null;
  try { json = await res.json(); } catch (e) { /* corpo vazio, ok para 2xx sem retorno */ }

  if (!res.ok) {
    // PostgREST devolve o erro da RPC em `message`, no formato "CODIGO|mensagem"
    // (é como _rotas_error() no banco levanta a exceção).
    const raw = String(json?.message || '');
    const sep = raw.indexOf('|');
    if (sep > -1) throw new ApiError(raw.slice(0, sep), raw.slice(sep + 1));
    throw new ApiError('SERVER_ERROR', json?.message || 'Erro no servidor.');
  }
  return json;
}

export const backendApi = {
  createRoom: ({ hostName, settings }) => rpc('rotas_create_room', { p_host_name: hostName, p_settings: settings || {} }),
  joinRoom: ({ roomCode, name }) => rpc('rotas_join_room', { p_room_code: roomCode, p_name: name }),
  getRoom: ({ roomCode, playerId }) => rpc('rotas_get_room', { p_room_code: roomCode, p_player_id: playerId ?? null }),
  startGame: ({ roomCode, hostId }) => rpc('rotas_start_game', { p_room_code: roomCode, p_host_id: hostId }),
  drawTile: ({ roomCode, playerId }) => rpc('rotas_draw_tile', { p_room_code: roomCode, p_player_id: playerId }),
  placeTile: ({ roomCode, playerId, x, y }) => rpc('rotas_place_tile', { p_room_code: roomCode, p_player_id: playerId, p_x: Number(x), p_y: Number(y) }),
  passTurn: ({ roomCode }) => rpc('rotas_pass_turn', { p_room_code: roomCode }),
  drawChallenge: ({ roomCode, playerId }) => rpc('rotas_draw_challenge', { p_room_code: roomCode, p_player_id: playerId }),
  answerChallenge: ({ roomCode, playerId, questionId, chosenIndex }) =>
    rpc('rotas_answer_challenge', { p_room_code: roomCode, p_player_id: playerId, p_question_id: Number(questionId), p_chosen_index: Number(chosenIndex) }),
  removePlayer: ({ roomCode, hostId, playerId }) => rpc('rotas_remove_player', { p_room_code: roomCode, p_host_id: hostId, p_player_id: playerId }),

  async healthCheck() {
    const data = await rpc('rotas_health_check', {});
    if (!data || !data.ok) throw new ApiError('SERVER_ERROR', 'Backend indisponível.');
    return { ok: true };
  },
};
