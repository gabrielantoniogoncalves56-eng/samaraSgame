/**
 * config.js
 * Configuração central do GeoBattle.
 * Trocar de "mock" para "backend" é feito automaticamente pelo app
 * assim que uma URL de Web App válida do Google Apps Script é salva
 * (veja js/api/api.js). Nada na interface precisa mudar.
 */
export const CONFIG = {
  APP_NAME: 'GeoBattle',
  VERSION: '1.0.0',

  // "mock" (padrão, funciona 100% offline) | "backend" (Google Apps Script)
  API_MODE: localStorage.getItem('gb_api_mode') || 'mock',

  // URL do Web App do Apps Script (ex: https://script.google.com/macros/s/XXX/exec)
  API_BASE_URL: localStorage.getItem('gb_api_url') || '',

  // Intervalo de polling (ms) usado pelo syncService quando em modo backend
  POLLING_INTERVAL: 1500,

  // Tempo mínimo entre polls quando a aba está em segundo plano
  POLLING_INTERVAL_BACKGROUND: 4000,

  DEBUG: false,

  MAX_PLAYERS: 60,
  ROOM_CODE_LENGTH: 6,
};

export function setApiMode(mode, url) {
  CONFIG.API_MODE = mode;
  localStorage.setItem('gb_api_mode', mode);
  if (url !== undefined) {
    CONFIG.API_BASE_URL = url;
    localStorage.setItem('gb_api_url', url);
  }
}
