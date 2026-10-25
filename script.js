// ============================================================
//  Manuel Tomasello — interazioni del sito
//  1) Linea del percorso professionale che si riempie allo scroll
//  2) Modulo contatti: apre il client di posta con il messaggio
//     già precompilato (mailto), senza servizi esterni.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Griglia illuminata che segue il cursore ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    let x = 0, y = 0, queued = false;
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        root.style.setProperty('--mx', x + 'px');
        root.style.setProperty('--my', y + 'px');
        queued = false;
      });
    }, { passive: true });
  }

  /* ---------- Barra di avanzamento della lettura ---------- */
  const updateRead = () => {
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--read', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  };
  window.addEventListener('scroll', updateRead, { passive: true });
  window.addEventListener('resize', updateRead);
  updateRead();

  /* ---------- Decodifica della seconda frase del titolo ---------- */
  const hidden = document.querySelector('h1 > span:last-child');
  if (hidden && !reduce) {
    const final = hidden.textContent;
    const glyphs = 'abcdeghnopqrsuvxz0123456789';
    const h1 = hidden.parentElement;
    h1.setAttribute('aria-label', h1.textContent);       // gli screen reader leggono il testo vero
    [...h1.children].forEach(c => c.setAttribute('aria-hidden', 'true'));
    hidden.classList.add('decoding');
    const bootDelay = root.classList.contains('boot') ? 1750 : 0;  // aspetta la sequenza di avvio
    const start = performance.now() + bootDelay + 450, dur = 1300;
    const tick = (now) => {
      const p = Math.min(Math.max((now - start) / dur, 0), 1);
      const fixed = Math.floor(p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) {
        const ch = final[i];
        out += (' .\''.includes(ch)) ? ch : glyphs[(Math.random() * glyphs.length) | 0];
      }
      hidden.textContent = out;
      if (p < 1) requestAnimationFrame(tick);
      else { hidden.textContent = final; hidden.classList.remove('decoding'); }
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Fine della sequenza di avvio ---------- */
  if (root.classList.contains('boot')) {
    setTimeout(() => root.classList.remove('boot'), 1750);
  }

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Rete viva nella testata ---------- */
  const canvas = document.querySelector('.net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const top = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, nodes = [], running = false, raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = top.clientWidth; h = top.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.round((w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        r: Math.random() * 1.4 + .6
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const link = 130, reach = 190;
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(34,211,190,${(1 - d / link) * .22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < reach) {
          ctx.strokeStyle = `rgba(120,240,225,${(1 - dm / reach) * .55})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = dm < reach ? 'rgba(200,255,248,.95)' : 'rgba(34,211,190,.55)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + (dm < reach ? .8 : 0), 0, Math.PI * 2); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    setup(); draw();
    if (!reduce) {
      new IntersectionObserver(([e]) => {
        running = e.isIntersecting;
        cancelAnimationFrame(raf);
        if (running) raf = requestAnimationFrame(draw);
      }).observe(top);
      top.addEventListener('pointermove', (e) => {
        const r = top.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      }, { passive: true });
      top.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
      let rt;
      window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { setup(); if (!running) draw(); }, 150); });
    }
  }

  /* ---------- Profondità 3D di ritratto e schema ---------- */
  const visual = document.querySelector('.hero-visual');
  if (visual && fine && !reduce) {
    const top = document.querySelector('.top');
    top.addEventListener('pointermove', (e) => {
      const r = visual.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      visual.style.setProperty('--ry', (dx * 16).toFixed(2) + 'deg');
      visual.style.setProperty('--rx', (-dy * 12).toFixed(2) + 'deg');
    }, { passive: true });
    top.addEventListener('pointerleave', () => {
      visual.style.setProperty('--ry', '0deg');
      visual.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- Sezioni che si materializzano ---------- */
  const sections = document.querySelectorAll('main > section');
  sections.forEach(sec => {
    sec.querySelectorAll('.panel, .project, .taglist span, .lang-table tr, .contact-card').forEach((el, i) => {
      el.classList.add('rv');
      el.style.setProperty('--i', i);
    });
  });
  if (reduce || !('IntersectionObserver' in window)) {
    sections.forEach(s => s.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Riflesso e inclinazione dei riquadri ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.panel, .project').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--gx', (px * 100) + '%');
        card.style.setProperty('--gy', (py * 100) + '%');
        card.style.setProperty('--ty', ((px - .5) * 5).toFixed(2) + 'deg');
        card.style.setProperty('--tx', ((.5 - py) * 5).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tx', '0deg');
        card.style.setProperty('--ty', '0deg');
      });
    });

    /* ---------- Pulsanti magnetici ---------- */
    document.querySelectorAll('.nav-cta, .btn-primary').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .3).toFixed(1) + 'px');
        btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .4).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    });
  }

  /* ---------- Progetti: schemi di flusso animati ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const splitLabel = (txt, max) => {          // al massimo due righe, spezzate allo spazio più centrale
    if (txt.length <= max || !txt.includes(' ')) return [txt];
    const mid = txt.length / 2;
    let best = -1;
    [...txt].forEach((c, i) => { if (c === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; });
    return [txt.slice(0, best), txt.slice(best + 1)];
  };

  const buildFlow = (box) => {
    const labels = box.dataset.flow.split('|');
    const n = labels.length;
    const vertical = box.clientWidth < 560;
    const step = 0.7, cycle = (n - 1) * step + 1.2;    // secondi: un pacchetto attraversa ogni collegamento
    box.textContent = '';

    let W, H, pos, edges;
    if (vertical) {
      const nw = 230, nh = 46, gap = 30;
      W = 300; H = n * nh + (n - 1) * gap;
      pos = labels.map((_, i) => ({ x: (W - nw) / 2, y: i * (nh + gap), w: nw, h: nh }));
      edges = pos.slice(0, -1).map((p, i) => `M${W / 2} ${p.y + p.h} V${pos[i + 1].y}`);
    } else {
      const gap = 36, nh = 58;
      W = 720; H = nh + 8;
      const nw = (W - gap * (n - 1)) / n;
      pos = labels.map((_, i) => ({ x: i * (nw + gap), y: 4, w: nw, h: nh }));
      edges = pos.slice(0, -1).map((p, i) => `M${p.x + p.w} ${p.y + p.h / 2} H${pos[i + 1].x}`);
    }

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: vertical ? 'flow-svg is-vertical' : 'flow-svg', role: 'img',
                            'aria-label': labels.join(', ') });
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: box.id + '-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L8 4 L0 8 z', class: 'flow-arrow' }, mk);

    edges.forEach((d, i) => {
      const p = el('path', { d, pathLength: 1, class: 'flow-edge', 'marker-end': `url(#${box.id}-arrow)` }, svg);
      p.style.setProperty('--d', (0.25 + i * 0.22) + 's');
      if (!reduce) {
        const dot = el('circle', { r: 3.6, class: 'flow-packet' }, svg);
        const a = (i * step) / cycle, b = (i * step + step) / cycle;
        el('animateMotion', { path: d, dur: cycle + 's', repeatCount: 'indefinite', calcMode: 'linear',
                              keyPoints: '0;0;1;1', keyTimes: `0;${a.toFixed(4)};${b.toFixed(4)};1` }, dot);
        el('animate', { attributeName: 'opacity', dur: cycle + 's', repeatCount: 'indefinite',
                        values: '0;0;1;1;0;0',
                        keyTimes: `0;${a.toFixed(4)};${(a + .01).toFixed(4)};${(b - .01).toFixed(4)};${b.toFixed(4)};1` }, dot);
      }
    });

    labels.forEach((label, i) => {
      const { x, y, w, h } = pos[i];
      const g = el('g', { class: 'flow-node' + (i === 0 ? ' is-source' : i === n - 1 ? ' is-output' : '') }, svg);
      g.style.setProperty('--d', (0.1 + i * 0.22) + 's');
      el('rect', { x, y, width: w, height: h, rx: 6, class: 'flow-box' }, g);
      if (!reduce) {
        const glow = el('rect', { x, y, width: w, height: h, rx: 6, class: 'flow-glow', opacity: 0 }, g);
        const t = i === 0 ? 0 : ((i - 1) * step + step) / cycle;
        const t1 = Math.min(t + .03, .99), t2 = Math.min(t + .28, .995);
        el('animate', { attributeName: 'opacity', dur: cycle + 's', repeatCount: 'indefinite',
                        values: '0;0;1;0;0', keyTimes: `0;${t.toFixed(4)};${t1.toFixed(4)};${t2.toFixed(4)};1` }, glow);
      }
      const lines = splitLabel(label, vertical ? 26 : 13);
      const tx = el('text', { x: x + w / 2, y: y + h / 2, class: 'flow-label' }, g);
      lines.forEach((ln, k) => {
        const ts = el('tspan', { x: x + w / 2, dy: k === 0 ? `${(0.35 - (lines.length - 1) * 0.6).toFixed(2)}em` : '1.2em' }, tx);
        ts.textContent = ln;
      });
    });

    box.appendChild(svg);
    box.dataset.layout = vertical ? 'v' : 'h';
  };

  document.querySelectorAll('.flow-toggle').forEach(btn => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.textContent = open ? btn.dataset.open : btn.dataset.close;
      if (open) { box.hidden = true; box.textContent = ''; return; }
      box.hidden = false;
      buildFlow(box);                               // ricostruito a ogni apertura: l'animazione riparte
    });
  });
  let flowResize;
  window.addEventListener('resize', () => {
    clearTimeout(flowResize);
    flowResize = setTimeout(() => {
      document.querySelectorAll('.flow:not([hidden])').forEach(box => {
        if ((box.clientWidth < 560 ? 'v' : 'h') !== box.dataset.layout) buildFlow(box);
      });
    }, 200);
  });

  /* ---------- Timeline ---------- */
  const track = document.querySelector('.track');
  if (track) {
    const fill = track.querySelector('.track-line-fill');
    const nodes = track.querySelectorAll('.node');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      nodes.forEach(n => n.classList.add('visible'));
      if (fill) fill.style.height = '100%';
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      }, { threshold: 0.15 });

      nodes.forEach(n => observer.observe(n));

      /* Percorso in 3D: le esperienze arrivano da lontano, inclinate,
         e si raddrizzano quando raggiungono il centro dello schermo. */
      let queued = false;
      const updateFill = () => {
        queued = false;
        const rect = track.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height;
        const visible = Math.min(Math.max(vh * 0.75 - rect.top, 0), total);
        const pct = total > 0 ? (visible / total) * 100 : 0;
        if (fill) fill.style.height = pct + '%';

        // il punto di fuga segue il centro dello schermo
        track.style.perspectiveOrigin = `6px ${(vh * 0.5 - rect.top).toFixed(0)}px`;
        const depth = window.innerWidth < 760 ? 220 : 420;
        nodes.forEach(n => {
          const r = n.getBoundingClientRect();
          const anchor = r.top + Math.min(r.height, vh * 0.5) * 0.35;   // la testa del blocco
          const t = (anchor - vh * 0.55) / (vh * 0.5);                   // 0 = al centro, 1 = in fondo allo schermo
          const k = Math.min(Math.max(t, 0), 1.4);                       // solo chi deve ancora arrivare
          const ease = k * k * (3 - 2 * Math.min(k, 1));
          n.style.transform = `translate3d(0, ${(ease * 40).toFixed(1)}px, ${(-ease * depth).toFixed(1)}px) rotateX(${(ease * 28).toFixed(2)}deg)`;
          n.style.opacity = (1 - Math.min(ease, 1) * 0.85).toFixed(3);
        });
      };
      const requestUpdate = () => { if (!queued) { queued = true; requestAnimationFrame(updateFill); } };

      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
      updateFill();
    }
  }

  /* ---------- Modulo contatti (mailto) ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    const lang = (document.documentElement.lang || 'it').slice(0, 2);
    const t = {
      it: { missing: 'Compila tutti i campi prima di inviare.',
            invalid: 'Inserisci un indirizzo email valido.',
            sent: 'Fatto! Si è aperto il tuo programma di posta — completa l’invio da lì.',
            label: 'Messaggio da', from: 'Da', email: 'Email', msg: 'Messaggio' },
      en: { missing: 'Please fill in all fields before sending.',
            invalid: 'Please enter a valid email address.',
            sent: 'Done! Your email app just opened — finish sending from there.',
            label: 'Message from', from: 'From', email: 'Email', msg: 'Message' },
      fr: { missing: 'Veuillez remplir tous les champs avant d’envoyer.',
            invalid: 'Veuillez saisir une adresse email valide.',
            sent: 'C’est fait ! Votre messagerie vient de s’ouvrir — terminez l’envoi depuis là.',
            label: 'Message de', from: 'De', email: 'Email', msg: 'Message' }
    }[lang] || null;
    const tr = t || { missing: 'Please fill in all fields.', invalid: 'Invalid email address.',
                      sent: 'Your email app has opened.', label: 'Message from', from: 'From',
                      email: 'Email', msg: 'Message' };

    const hint = document.getElementById('formHint');
    const setHint = (text, ok) => {
      if (!hint) return;
      hint.textContent = text;
      hint.classList.toggle('ok', !!ok);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('#cf-name').value.trim();
      const email = form.querySelector('#cf-email').value.trim();
      const message = form.querySelector('#cf-message').value.trim();

      if (!name || !email || !message) {
        setHint(tr.missing, false);
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        setHint(tr.invalid, false);
        return;
      }

      const to = form.dataset.mailto;
      const subject = (form.dataset.subject || 'Contatto') + ' — ' + name;
      const body =
        tr.from + ': ' + name + '\n' +
        tr.email + ': ' + email + '\n\n' +
        tr.msg + ':\n' + message + '\n';

      const href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      window.location.href = href;
      setHint(tr.sent, true);
    });
  }
});
