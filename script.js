// ============================================================
//  Manuel Tomasello — interazioni del sito
//  1) Linea del percorso professionale che si riempie allo scroll
//  2) Modulo contatti: apre il client di posta con il messaggio
//     già precompilato (mailto), senza servizi esterni.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

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
      }, { threshold: 0.4 });

      nodes.forEach(n => observer.observe(n));

      const updateFill = () => {
        const rect = track.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height;
        const visible = Math.min(Math.max(vh * 0.75 - rect.top, 0), total);
        const pct = total > 0 ? (visible / total) * 100 : 0;
        if (fill) fill.style.height = pct + '%';
      };

      window.addEventListener('scroll', updateFill, { passive: true });
      window.addEventListener('resize', updateFill);
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
