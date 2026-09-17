/**
 * config.js
 * Backend real = projeto Supabase (Postgres + RPCs), acessado via
 * PostgREST com a chave anon (pública, segura para expor no cliente —
 * toda a regra de negócio roda nas RPCs SECURITY DEFINER no banco).
 *
 * ONLINE_MODE controla se a interface usa o Supabase (multiplayer real)
 * ou o mockApi local (modo demo com bots). Alternável na tela
 * Configurações; por padrão começa online, já que o backend está
 * sempre disponível (não depende mais de o usuário colar uma URL).
 */
export const CONFIG = {
  APP_NAME: 'ROTAS — Caminhos da Migração',
  VERSION: '2.0.0',

  SUPABASE_URL: 'https://ufbdibkboifaogaujfld.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYmRpYmtib2lmYW9nYXVqZmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mjc0NDEsImV4cCI6MjEwNTIwMzQ0MX0.xUMVabynBH_aY4bOGklJEEmPvOia20S_3h7eIW6zLeU',

  ONLINE_MODE: (localStorage.getItem('rotas_online_mode') ?? '1') === '1',

  DEBUG: false,
};

export function setOnlineMode(enabled) {
  CONFIG.ONLINE_MODE = !!enabled;
  localStorage.setItem('rotas_online_mode', CONFIG.ONLINE_MODE ? '1' : '0');
}
