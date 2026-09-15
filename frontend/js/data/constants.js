export const CATEGORIES = [
  'Geografia do Brasil', 'Geografia Física', 'Geografia Humana', 'Cartografia',
  'Clima', 'Relevo', 'Hidrografia', 'Geopolítica', 'População', 'Economia',
  'Globalização', 'Meio Ambiente', 'Biomas', 'Capitais e Países', 'Coordenadas Geográficas',
  'Urbanização',
];

export const MODES = [
  { id: 'classic', name: 'Clássico', icon: '🌎', desc: 'Todos respondem as mesmas perguntas. Pontuação por acerto + velocidade.' },
  { id: 'survival', name: 'Sobrevivência', icon: '💥', desc: '3 vidas. Errar tira 1 vida. Ao zerar, o jogador é eliminado.' },
  { id: 'time', name: 'Contra o Tempo', icon: '⏱️', desc: 'Tempo reduzido — quanto mais rápido, maior a pontuação.' },
  { id: 'training', name: 'Treino', icon: '🎯', desc: 'Sem competição. Feedback imediato após cada resposta.' },
];

export const DIFFICULTIES = [
  { id: 'easy', name: 'Fácil' },
  { id: 'medium', name: 'Médio' },
  { id: 'hard', name: 'Difícil' },
  { id: 'random', name: 'Aleatório' },
];

export const QUESTION_COUNTS = [5, 10, 15, 20];
export const QUESTION_TIMES = [10, 20, 30, 45, 60];

export const CATEGORY_ICONS = {
  'Geografia do Brasil': '🇧🇷', 'Geografia Física': '🏔️', 'Geografia Humana': '🧑‍🤝‍🧑',
  'Cartografia': '🗺️', 'Clima': '🌦️', 'Relevo': '⛰️', 'Hidrografia': '🌊',
  'Geopolítica': '🌐', 'População': '👥', 'Economia': '💰', 'Globalização': '🔗',
  'Meio Ambiente': '🌿', 'Biomas': '🌳', 'Capitais e Países': '🏙️',
  'Coordenadas Geográficas': '📍', 'Urbanização': '🏗️',
};
