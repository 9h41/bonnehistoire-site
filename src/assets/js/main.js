(() => {
  // mobile menu
  const btn = document.querySelector('.menu-btn'), overlay = document.getElementById('menu-overlay');
  if (btn && overlay) {
    const set = (open) => { overlay.hidden = !open; btn.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; };
    btn.addEventListener('click', () => set(true));
    overlay.querySelector('.menu-close').addEventListener('click', () => set(false));
    overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  // testimonials carousel
  const slides = [...document.querySelectorAll('.review')];
  if (slides.length) {
    let i = 0;
    const show = (n) => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', String(k !== i)); }); };
    document.querySelector('.rev-prev')?.addEventListener('click', () => show(i - 1));
    document.querySelector('.rev-next')?.addEventListener('click', () => show(i + 1));
    show(0);
    // autoplay, as on the previous site (paused while hovered or focused, and for reduced motion)
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const box = document.querySelector('.reviews');
      let paused = false;
      box.addEventListener('mouseenter', () => (paused = true)); box.addEventListener('mouseleave', () => (paused = false));
      box.addEventListener('focusin', () => (paused = true)); box.addEventListener('focusout', () => (paused = false));
      setInterval(() => { if (!paused && !document.hidden) show(i + 1); }, 6000);
    }
  }

  // hero: the phone and its label grow while scrolling (values measured on the previous site)
  const phone = document.querySelector('.phone'), pill = document.querySelector('.hero-pill');
  const introFirst = () => [...document.querySelectorAll('.intro > *')].find((el) => el.offsetParent) || document.querySelector('.intro');
  if (phone && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const narrow = matchMedia('(max-width: 768px)');
    const zoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom')) || 1;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = narrow.matches ? scrollY : scrollY / zoom();
      let s = narrow.matches ? 1 + Math.min(y, 800) * 0.000473 : 1 + Math.min(Math.max(0, y - 300), 1100) * 0.000414;
      // never let the grown phone reach the text of the next section (keep a 40px gap, in design px)
      const r = phone.getBoundingClientRect(), cur = parseFloat((phone.style.transform.match(/scale\(([\d.]+)/) || [0, 1])[1]);
      const unit = r.width / cur / (narrow.matches ? 240 : 350);
      const room = introFirst().getBoundingClientRect().top - r.top - 40 * unit;
      s = Math.max(1, Math.min(s, room / (r.height / cur)));
      const t = s > 1.0005 ? 'scale(' + s.toFixed(4) + ')' : '';
      phone.style.transform = t; if (pill) pill.style.transform = t;
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // beta / newsletter sign-up: posted to the relay (worker/), which asks Brevo for a double opt-in e-mail
  const form = document.querySelector('[data-beta]');
  if (form) {
    const msg = form.querySelector('.beta-msg'), btn = form.querySelector('button');
    const say = (text, ok) => { msg.textContent = text; msg.classList.toggle('is-error', !ok); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim(), consent = form.consent.checked;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return say('Merci de saisir une adresse e-mail valide.', false), form.email.focus();
      if (!consent) return say('Merci de cocher la case pour accepter de recevoir nos informations.', false);
      btn.disabled = true; say('Envoi…', true);
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, consent, website: form.website.value }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || res.status);
        form.reset();
        say('Merci ! Un e-mail de confirmation vient de vous être envoyé : cliquez sur le lien qu\'il contient pour finaliser votre inscription.', true);
      } catch {
        say('Une erreur est survenue. Réessayez plus tard ou écrivez-nous à contact@bonnehistoire.fr.', false);
      } finally { btn.disabled = false; }
    });
  }
})();
