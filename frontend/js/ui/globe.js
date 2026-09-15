/**
 * globe.js
 * Cria o globo 3D (CSS puro, sem bibliotecas) usado na tela Home, e um
 * fundo de partículas/estrelas em canvas para dar profundidade.
 * "3D" aqui é feito com transform-style: preserve-3d + múltiplos anéis
 * de latitude/longitude girando em eixos diferentes — leve e sem custo
 * de WebGL, ideal para rodar bem em qualquer celular.
 */
export function renderGlobe() {
  const ringsLat = Array.from({ length: 6 }).map((_, i) => {
    const rotate = (i / 6) * 180;
    return `<div class="globe__ring globe__ring--lat" style="transform: rotateX(${rotate}deg)"></div>`;
  }).join('');
  const ringsLon = Array.from({ length: 6 }).map((_, i) => {
    const rotate = (i / 6) * 180;
    return `<div class="globe__ring globe__ring--lon" style="transform: rotateY(${rotate}deg)"></div>`;
  }).join('');

  return `
    <div class="globe-scene" aria-hidden="true">
      <div class="globe">
        <div class="globe__core"></div>
        ${ringsLat}
        ${ringsLon}
        <div class="globe__pin globe__pin--1">📍</div>
        <div class="globe__pin globe__pin--2">📍</div>
        <div class="globe__pin globe__pin--3">📍</div>
      </div>
      <div class="globe-glow"></div>
    </div>
  `;
}

/**
 * Fundo de estrelas/partículas sutil — canvas leve, redesenhado com
 * requestAnimationFrame, para dar sensação espacial/geográfica ao app.
 */
export function startParticleField(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, particles, raf;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function init() {
    resize();
    const count = Math.min(90, Math.floor((w * h) / 40000));
    particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      a: Math.random() * 0.6 + 0.2,
    }));
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.fillStyle = `rgba(120, 220, 255, ${p.a})`;
      ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(step);
  }

  init();
  step();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
