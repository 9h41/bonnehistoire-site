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
  if (phone && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const narrow = matchMedia('(max-width: 768px)');
    const zoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom')) || 1;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = narrow.matches ? scrollY : scrollY / zoom();
      const s = narrow.matches ? 1 + Math.min(y, 800) * 0.000473 : 1 + Math.min(Math.max(0, y - 300), 1100) * 0.000414;
      const t = s > 1.0005 ? 'scale(' + s.toFixed(4) + ')' : '';
      phone.style.transform = t; if (pill) pill.style.transform = t;
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // beta sign-up: composes the e-mail in the visitor's mail app (no server here)
  const form = document.querySelector('[data-beta]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type=email]').value.trim();
    if (!email) return;
    location.href = 'mailto:contact@bonnehistoire.fr?subject=' + encodeURIComponent('Accès à la version bêta') + '&body=' + encodeURIComponent('Bonjour, je souhaite accéder à la version bêta de La bonne histoire. Mon e-mail : ' + email);
    form.querySelector('.beta-ok').hidden = false;
  });
})();
