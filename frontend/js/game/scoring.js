/**
 * scoring.js
 * Motor de pontuação 100% automático do ROTAS. Opera sobre o array de
 * tiles de um jogador — {x, y, territory, profile} — e calcula tudo:
 * corredores de território (A), cartas de perfil migratório (C) e os
 * dados necessários para os bônus comparativos (B e D), que são
 * resolvidos comparando vários jogadores ao mesmo tempo (veja
 * `rankPlayers`). Reaproveita exatamente as fórmulas do jogo físico.
 */
import { TERRITORIES, PROFILES } from '../data/gameData.js';

const DIRS8 = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];
const LINE_DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

function keyOf(x, y) { return `${x},${y}`; }

function buildIndex(tiles) {
  const map = new Map();
  tiles.forEach((t) => map.set(keyOf(t.x, t.y), t));
  return map;
}

export function neighbors8(x, y) {
  return DIRS8.map(([dx, dy]) => [x + dx, y + dy]);
}

export function isAdjacentToAny(tiles, x, y) {
  const map = buildIndex(tiles);
  return neighbors8(x, y).some(([nx, ny]) => map.has(keyOf(nx, ny)));
}

/** Componentes conectadas (8 direções) filtradas por um predicado. */
function connectedComponents(tiles, predicate) {
  const map = buildIndex(tiles);
  const visited = new Set();
  const components = [];
  tiles.forEach((t) => {
    const k = keyOf(t.x, t.y);
    if (visited.has(k) || !predicate(t)) return;
    const comp = [];
    const stack = [t];
    visited.add(k);
    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      neighbors8(cur.x, cur.y).forEach(([nx, ny]) => {
        const nk = keyOf(nx, ny);
        const nt = map.get(nk);
        if (nt && !visited.has(nk) && predicate(nt)) {
          visited.add(nk);
          stack.push(nt);
        }
      });
    }
    components.push(comp);
  });
  return components;
}

// ---------------- A) Corredores de território ----------------
export function corridorScore(tiles) {
  const perTerritory = {};
  let total = 0;
  TERRITORIES.forEach((t) => {
    const comps = connectedComponents(tiles, (x) => x.territory === t.id);
    const max = comps.reduce((m, c) => Math.max(m, c.length), 0);
    perTerritory[t.id] = max;
    total += max;
  });
  return { total, perTerritory };
}

// ---------------- Linhas (Migração Interna) ----------------
function lineScore(tiles) {
  const map = buildIndex(tiles);
  const profileTiles = tiles.filter((t) => t.profile === 'migracao-interna');
  const set = new Set(profileTiles.map((t) => keyOf(t.x, t.y)));
  let score = 0;
  const table = (len) => (len >= 5 ? 10 : len === 4 ? 6 : len === 3 ? 3 : 0);

  LINE_DIRS.forEach(([dx, dy]) => {
    const seen = new Set();
    profileTiles.forEach((t) => {
      // só inicia contagem se não houver vizinho "anterior" na mesma direção (início da linha)
      const prevKey = keyOf(t.x - dx, t.y - dy);
      if (set.has(prevKey)) return;
      let len = 0;
      let cx = t.x, cy = t.y;
      const cells = [];
      while (set.has(keyOf(cx, cy))) {
        cells.push(keyOf(cx, cy));
        len += 1; cx += dx; cy += dy;
      }
      if (len >= 3) {
        score += table(len);
      }
    });
  });
  return score;
}

// ---------------- Pareamento máximo (Emigração) ----------------
function pairScore(tiles) {
  const profileTiles = tiles.filter((t) => t.profile === 'emigracao');
  const map = buildIndex(tiles);
  const ids = profileTiles.map((t) => keyOf(t.x, t.y));
  const idSet = new Set(ids);
  const adj = new Map();
  profileTiles.forEach((t) => {
    const k = keyOf(t.x, t.y);
    const list = neighbors8(t.x, t.y)
      .map(([nx, ny]) => keyOf(nx, ny))
      .filter((nk) => idSet.has(nk));
    adj.set(k, list);
  });

  // Heurística gulosa: casa primeiro os nós com menos opções (boa
  // aproximação de pareamento máximo em grafos pequenos como este).
  const matched = new Set();
  let pairs = 0;
  const order = [...idSet].sort((a, b) => adj.get(a).length - adj.get(b).length);
  order.forEach((k) => {
    if (matched.has(k)) return;
    const partner = adj.get(k).find((nk) => !matched.has(nk));
    if (partner) { matched.add(k); matched.add(partner); pairs += 1; }
  });

  return lookupTable(pairs, [0, 3, 7, 12, 18]);
}

// ---------------- Isolados (Refúgio) ----------------
function isolatedScore(tiles) {
  const profileTiles = tiles.filter((t) => t.profile === 'refugio');
  const idSet = new Set(profileTiles.map((t) => keyOf(t.x, t.y)));
  let isolated = 0;
  profileTiles.forEach((t) => {
    const hasNeighbor = neighbors8(t.x, t.y).some(([nx, ny]) => idSet.has(keyOf(nx, ny)));
    if (!hasNeighbor) isolated += 1;
  });
  return lookupTable(isolated, [0, 2, 5, 9, 14]);
}

// ---------------- Grupos (Imigração) ----------------
function groupScore(tiles) {
  const comps = connectedComponents(tiles, (t) => t.profile === 'imigracao');
  let score = 0;
  comps.forEach((c) => {
    if (c.length >= 6) score += 14;
    else if (c.length === 5) score += 9;
    else if (c.length === 4) score += 5;
  });
  return score;
}

// ---------------- Diversidade (Êxodo Rural) ----------------
function diversityScore(tiles) {
  const map = buildIndex(tiles);
  const profileTiles = tiles.filter((t) => t.profile === 'exodo-rural');
  let score = 0;
  profileTiles.forEach((t) => {
    const types = new Set();
    neighbors8(t.x, t.y).forEach(([nx, ny]) => {
      const nt = map.get(keyOf(nx, ny));
      if (nt) types.add(nt.territory);
    });
    score += Math.min(5, types.size);
  });
  return score;
}

function lookupTable(n, table) {
  const i = Math.min(Math.max(0, n), table.length - 1);
  return table[i];
}

/** Maior grupo conectado de um perfil (usado no Bônus D). */
function maxProfileGroup(tiles, profileId) {
  const comps = connectedComponents(tiles, (t) => t.profile === profileId);
  return comps.reduce((m, c) => Math.max(m, c.length), 0);
}

// ---------------- C) Cartas de Perfil Migratório ----------------
export function profileScore(tiles) {
  const perProfile = {};
  let total = 0;
  PROFILES.forEach((p) => {
    let s = 0;
    if (p.scoring.type === 'diversity') s = diversityScore(tiles);
    else if (p.scoring.type === 'line') s = lineScore(tiles);
    else if (p.scoring.type === 'group') s = groupScore(tiles);
    else if (p.scoring.type === 'pairs') s = pairScore(tiles);
    else if (p.scoring.type === 'isolated') s = isolatedScore(tiles);
    perProfile[p.id] = s;
    total += s;
  });
  return { total, perProfile };
}

export function maxGroupsPerProfile(tiles) {
  const out = {};
  PROFILES.forEach((p) => { out[p.id] = maxProfileGroup(tiles, p.id); });
  return out;
}

/**
 * Calcula a pontuação completa de UM jogador (sem os bônus B/D, que
 * dependem da comparação entre todos os jogadores da sala).
 */
export function computeBaseScore(tiles) {
  const corridors = corridorScore(tiles || []);
  const profiles = profileScore(tiles || []);
  const groups = maxGroupsPerProfile(tiles || []);
  return { A: corridors.total, perTerritory: corridors.perTerritory, C: profiles.total, perProfile: profiles.perProfile, maxGroups: groups };
}

/**
 * Recebe a lista de jogadores (cada um com .tiles e .bonusScore) e
 * devolve o ranking completo já com os bônus B e D calculados e
 * ordenado do maior para o menor total.
 */
export function rankPlayers(players) {
  const base = players.map((pl) => ({ player: pl, ...computeBaseScore(pl.tiles) }));

  TERRITORIES.forEach((t) => {
    const max = Math.max(...base.map((r) => r.perTerritory[t.id] || 0));
    if (max <= 0) return;
    const winners = base.filter((r) => (r.perTerritory[t.id] || 0) === max);
    if (winners.length === 1) winners[0].B = (winners[0].B || 0) + 3;
  });

  PROFILES.forEach((p) => {
    const max = Math.max(...base.map((r) => r.maxGroups[p.id] || 0));
    if (max <= 0) return;
    const winners = base.filter((r) => (r.maxGroups[p.id] || 0) === max);
    if (winners.length === 1) winners[0].D = (winners[0].D || 0) + 3;
  });

  base.forEach((r) => {
    r.B = r.B || 0;
    r.D = r.D || 0;
    r.E = (r.player.bonusScore || 0);
    r.total = r.A + r.B + r.C + r.D + r.E;
  });

  return base.sort((a, b) => b.total - a.total);
}
