/**
 * animations.js — confete de vitória e pequenos pulsos de feedback.
 */
export function launchConfetti(durationMs = 2600) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#22d3ee', '#a78bfa', '#facc15', '#f472b6', '#4ade80', '#60a5fa'];
  const pieces = Array.from({ length: 140 }).map(() => ({
    x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.5,
    r: 4 + Math.random() * 5, c: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3, vx: (Math.random() - 0.5) * 2,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
  }));
  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      ctx.restore();
    });
    if (t < durationMs) requestAnimationFrame(frame);
    else { window.removeEventListener('resize', resize); canvas.remove(); }
  }
  requestAnimationFrame(frame);
}

export function pulse(el, cls = 'pulse-once') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
