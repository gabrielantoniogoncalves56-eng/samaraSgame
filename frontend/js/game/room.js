/**
 * room.js — pequenas utilidades compartilhadas: geração de ids locais
 * (modo demo) e sorteio de tile aleatório (território + perfil).
 */
import { TERRITORIES, PROFILES } from '../data/gameData.js';

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateRoomCode(existingCodes = []) {
  for (let tries = 0; tries < 50; tries++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
    if (!existingCodes.includes(code)) return code;
  }
  throw new Error('Não foi possível gerar um código único.');
}

/** Sorteia um tile aleatório (território + perfil), como a "função de sorteio" substituindo o saco físico. */
export function randomTile() {
  const territory = TERRITORIES[Math.floor(Math.random() * TERRITORIES.length)].id;
  const profile = PROFILES[Math.floor(Math.random() * PROFILES.length)].id;
  return { territory, profile };
}

export const BOT_NAMES = ['Léo', 'Maria', 'João', 'Ana', 'Bia', 'Rafa'];
