/**
 * timer.js
 * Contador regressivo reutilizável, baseado em requestAnimationFrame
 * para uma barra/anel de progresso suave.
 */
export class CountdownTimer {
  /**
   * @param {number} durationMs
   * @param {(remainingMs:number, ratio:number)=>void} onTick
   * @param {()=>void} onEnd
   */
  constructor(durationMs, onTick, onEnd) {
    this.duration = durationMs;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.startedAt = null;
    this.raf = null;
    this.ended = false;
  }

  start(elapsedAlreadyMs = 0) {
    this.startedAt = performance.now() - elapsedAlreadyMs;
    this.ended = false;
    const step = (now) => {
      if (this.ended) return;
      const elapsed = now - this.startedAt;
      const remaining = Math.max(0, this.duration - elapsed);
      const ratio = this.duration ? remaining / this.duration : 0;
      this.onTick(remaining, ratio);
      if (remaining <= 0) {
        this.ended = true;
        this.onEnd();
        return;
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  stop() {
    this.ended = true;
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
