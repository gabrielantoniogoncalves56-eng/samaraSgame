/**
 * config.js
 * Única variável que a interface usa para saber onde buscar o banco de
 * desafios remoto (Google Apps Script). Sem essa URL configurada, o
 * app funciona 100% offline com o banco local (js/data/challenges.js).
 *
 * Não existe nenhum campo de API no backend — a "API" é o próprio
 * Web App do Apps Script, identificado apenas pela URL de publicação.
 */
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbwYuHQyDDJ60UvW1JkEWuHGXWJg-A8c--DBFpWjZG_61-um28JS2UAZqxYRETkvUque/exec';

export const CONFIG = {
  APP_NAME: 'ROTAS — Caminhos da Migração',
  VERSION: '1.0.0',

  // Variável única de integração: cole aqui (ou na tela Configurações)
  // a URL do Web App publicado em backend/. O projeto já vem com a API oficial configurada por padrão.
  API_BASE_URL: localStorage.getItem('rotas_api_url') || DEFAULT_API_URL,

  DEBUG: false,
};

export function setApiUrl(url) {
  CONFIG.API_BASE_URL = String(url || '').trim();
  localStorage.setItem('rotas_api_url', CONFIG.API_BASE_URL);
}
