/**
 * heroArt.js
 * Cena 3D (CSS + SVG, sem bibliotecas) para a tela inicial: uma rede de
 * rotas entre destinos, com profundidade em camadas, leve paralaxe ao
 * mover o mouse/toque e marcadores viajando pelas rotas.
 */
import { icon } from './icons.js';
import { TERRITORIES } from '../data/gameData.js';

// Layout em pentágono (posições relativas, 0-300 viewBox)
const NODES = [
  { x: 150, y: 40, t: 0 },   // topo
  { x: 265, y: 120, t: 1 },
  { x: 220, y: 255, t: 2 },
  { x: 80, y: 255, t: 3 },
  { x: 35, y: 120, t: 4 },
];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3]];

export function renderHero3D() {
  const nodesHtml = NODES.map((n, i) => {
    const t = TERRITORIES[n.t];
    return `
      <g class="hero3d__node" style="--nd:${i % 3}">
        <circle cx="${n.x}" cy="${n.y}" r="16" fill="none" stroke="${t.color}" stroke-width="1.6" class="hero3d__node-ring"/>
        <circle cx="${n.x}" cy="${n.y}" r="16" fill="${t.color}" opacity="0.08"/>
        <g transform="translate(${n.x - 9},${n.y - 9})" style="color:${t.color}">${icon(t.icon, { size: 18, strokeWidth: 1.6 })}</g>
      </g>`;
  }).join('');

  const edgesHtml = EDGES.map(([a, b], i) => {
    const A = NODES[a], B = NODES[b];
    return `<path d="M${A.x},${A.y} L${B.x},${B.y}" class="hero3d__edge" style="--ei:${i}"/>`;
  }).join('');

  const travelersHtml = EDGES.slice(0, 3).map(([a, b], i) => {
    const A = NODES[a], B = NODES[b];
    return `
      <circle r="3" class="hero3d__traveler" style="--ti:${i}">
        <animateMotion dur="${5 + i * 1.6}s" repeatCount="indefinite"
          path="M${A.x},${A.y} L${B.x},${B.y} L${A.x},${A.y}" />
      </circle>`;
  }).join('');

  return `
    <div class="hero3d" id="hero3d">
      <div class="hero3d__stage" id="hero3dStage">
        <svg viewBox="0 0 300 300" class="hero3d__svg" aria-hidden="true">
          <defs>
            <pattern id="dotgrid" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(148,197,255,0.16)"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width="300" height="300" fill="url(#dotgrid)" class="hero3d__grid"/>
          ${edgesHtml}
          ${travelersHtml}
          ${nodesHtml}
        </svg>
      </div>
      <div class="hero3d__glow"></div>
    </div>
  `;
}

/** Ativa a leve paralaxe 3D ao mover o mouse (desktop) — nunca bloqueia o toque. */
export function bindHeroParallax(root) {
  const wrap = root.querySelector('#hero3d');
  const stage = root.querySelector('#hero3dStage');
  if (!wrap || !stage) return () => {};
  const onMove = (e) => {
    const rect = wrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    stage.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
    stage.style.setProperty('--ry', `${(px * 14).toFixed(2)}deg`);
  };
  const onLeave = () => {
    stage.style.setProperty('--rx', `6deg`);
    stage.style.setProperty('--ry', `0deg`);
  };
  wrap.addEventListener('pointermove', onMove);
  wrap.addEventListener('pointerleave', onLeave);
  onLeave();
  return () => {
    wrap.removeEventListener('pointermove', onMove);
    wrap.removeEventListener('pointerleave', onLeave);
  };
}
