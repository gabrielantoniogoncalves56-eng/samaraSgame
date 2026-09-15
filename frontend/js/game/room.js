/**
 * room.js
 * Utilidades de sala compartilhadas pelo mockApi (o backend real tem
 * sua própria implementação equivalente em RoomService.gs).
 */
// Evita caracteres confusos: 0/O, 1/I/L
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(existingCodes = []) {
  for (let tries = 0; tries < 50; tries++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
    }
    if (!existingCodes.includes(code)) return code;
  }
  throw new Error('Não foi possível gerar um código único.');
}

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const BOT_NAMES = ['Léo', 'Maria', 'João', 'Ana', 'Bia', 'Rafa', 'Sofia', 'Théo'];
