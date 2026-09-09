// Riempimento progressivo della linea del percorso professionale
// e comparsa graduale delle singole tappe allo scroll.

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.track');
  if (!track) return;

  const fill = track.querySelector('.track-line-fill');
  const nodes = track.querySelectorAll('.node');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    nodes.forEach(n => n.classList.add('visible'));
    if (fill) fill.style.height = '100%';
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.4 });

  nodes.forEach(n => observer.observe(n));

  function updateFill() {
    const rect = track.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height;
    const visible = Math.min(Math.max(vh * 0.75 - rect.top, 0), total);
    const pct = total > 0 ? (visible / total) * 100 : 0;
    if (fill) fill.style.height = pct + '%';
  }

  window.addEventListener('scroll', updateFill, { passive: true });
  window.addEventListener('resize', updateFill);
  updateFill();
});
