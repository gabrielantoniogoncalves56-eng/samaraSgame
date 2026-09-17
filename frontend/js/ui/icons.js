/**
 * icons.js
 * Conjunto de ícones SVG monocromáticos, estilo linha, desenhados do
 * zero para o ROTAS — substitui qualquer uso de emoji na interface.
 * Uso: icon('tree', { size: 22, className: 'icon' })
 */
const PATHS = {
  // ---- territórios ----
  tree: '<path d="M12 3 7 10h2.2L6 15h3.2L6.5 19H12M12 3l5 7h-2.2L18 15h-3.2l2.7 4H12M12 19v2"/>',
  building: '<rect x="6" y="4" width="12" height="16" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
  houses: '<path d="M4 20V11l4-3 4 3v9"/><path d="M12 20v-6l4-3 4 3v6"/><path d="M4 20h16"/>',
  skyline: '<path d="M4 20V9l3-2 3 2v11"/><path d="M10 20V6l3-3 3 3v14"/><path d="M16 20v-8l2-1.5L20 12v8"/><path d="M2 20h20"/>',
  flag: '<path d="M6 3v18"/><path d="M6 4h11l-2.5 3.5L17 11H6"/>',

  // ---- perfis migratórios ----
  tractor: '<circle cx="7" cy="17" r="3"/><circle cx="18" cy="17" r="2.2"/><path d="M7 17V9h4l3 4h3.5a1.5 1.5 0 0 1 1.5 1.5V17"/><path d="M11 9V6h2"/>',
  route: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M5 8c0 6 14 2 14 8"/>',
  planeLanding: '<path d="M3 19h18"/><path d="M5 15l6-1.5 6.5-5.5a1.2 1.2 0 0 1 1.8 1.6L15 13.5l3 .3 2 1.7-6.2.9L9 18l-2-.2 1.6-2.4L5 15z"/>',
  planeTakeoff: '<path d="M3 19h18"/><path d="M6 12.5l5.5-2 4-6a1.2 1.2 0 0 1 2 1.3l-2.7 5.6 2.8 1-1.2 1.8-3-.4-4 3-2-.3 1.2-2.6-2.6.6z"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',

  // ---- UI ----
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.15-1.4l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.4-1.4L14 3h-4l-.15 2.2a7 7 0 0 0-2.4 1.4l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.05.9.15 1.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.4 1.4L10 21h4l.15-2.2a7 7 0 0 0 2.4-1.4l2.3.9 2-3.4-2-1.5c.1-.5.15-.9.15-1.4z"/>',
  soundOn: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
  soundOff: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9l5 5M21 9l-5 5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  share: '<circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M8 10.8l8-4.4M8 13.2l8 4.4"/>',
  print: '<rect x="6" y="9" width="12" height="7" rx="1"/><path d="M6 9V4h12v5"/><path d="M8 16v4h8v-4"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="8.5" cy="15.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/><path d="M20 19H6.5A2.5 2.5 0 0 0 4 21.5"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><path d="M8 11h1M11.5 11h1M15 11h1M8 14.5h1M11.5 14.5h1M15 14.5h1M8 18h1M11.5 18h1M15 14.5v4"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 11h1v6h1"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  refresh: '<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6"/><path d="M4 4v4.6h4.6"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.4"/><path d="M20 20v-4.6h-4.6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15 14.3c2.4.3 4 2.3 4 5.7"/>',
  scissors: '<circle cx="7" cy="6" r="2.2"/><circle cx="7" cy="18" r="2.2"/><path d="M9 7.5L20 18M9 16.5L20 6"/>',
  cards: '<rect x="4" y="6" width="12" height="15" rx="1.5"/><path d="M9 3l10 3-4 14"/>',
  filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
  swap: '<path d="M7 4v13M7 17l-3-3M7 17l3-3"/><path d="M17 20V7M17 7l3 3M17 7l-3 3"/>',
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4a3 3 0 0 0 3 5"/><path d="M17 5h3a3 3 0 0 1-3 5"/><path d="M10 14v3h4v-3"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  flame: '<path d="M12 3c2 3-2 4-1 7 .5 1.5 2 2 2 2s3-1.5 3-5c2 2 3 4 3 6.5A6.5 6.5 0 0 1 6 13.5C6 9 9 6 12 3z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  crown: '<path d="M4 8l4 4 4-6 4 6 4-4-2 10H6L4 8z"/><path d="M6 20h12"/>',
  grid: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',
  play: '<path d="M7 4l13 8-13 8V4z"/>',
  wifi: '<path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5.5 12a11 11 0 0 1 13 0"/><path d="M9 15.5a6 6 0 0 1 6 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
};

export function icon(name, { size = 22, className = '', strokeWidth = 1.8 } = {}) {
  const body = PATHS[name] || PATHS.info;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${body}</svg>`;
}
