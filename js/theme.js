/* Theme toggle — dark / light avec persistance localStorage */
(function () {
  const STORAGE_KEY = 'mf-theme';

  function getStoredTheme() {
    try {
      const t = localStorage.getItem(STORAGE_KEY);
      if (t === 'light' || t === 'dark') return t;
    } catch (_) {}
    return 'dark';
  }

  function themeColors(theme) {
    return theme === 'light'
      ? { bg: '#F0EDE6', fg: '#0A0A0A' }
      : { bg: '#0A0A0A', fg: '#F0EDE6' };
  }

  function syncToggleUI(theme) {
    const isLight = theme === 'light';

    document.querySelectorAll('.js-theme-label').forEach((el) => {
      el.textContent = isLight ? 'LIGHT' : 'DARK';
    });

    document.querySelectorAll('#theme-toggle, .js-theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        isLight ? 'Activer le mode sombre' : 'Activer le mode clair'
      );
      btn.classList.toggle('is-light', isLight);
    });
  }

  function applyTheme(theme, { animate = false } = {}) {
    const next = theme === 'light' ? 'light' : 'dark';
    const { bg, fg } = themeColors(next);

    document.documentElement.setAttribute('data-theme', next);
    if (document.body) document.body.setAttribute('data-theme', next);

    if (typeof gsap !== 'undefined' && animate && document.body) {
      gsap.to(document.body, {
        backgroundColor: bg,
        color: fg,
        duration: 0.45,
        ease: 'power2.inOut',
      });
    } else if (document.body) {
      document.body.style.backgroundColor = bg;
      document.body.style.color = fg;
    }

    syncToggleUI(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }

  function toggleTheme() {
    applyTheme(getStoredTheme() === 'light' ? 'dark' : 'light', { animate: true });
  }

  function initThemeToggle() {
    document.querySelectorAll('#theme-toggle, .js-theme-toggle').forEach((btn) => {
      if (btn.dataset.themeBound) return;
      btn.dataset.themeBound = '1';
      btn.addEventListener('click', toggleTheme);
    });
  }

  window.MF = window.MF || {};
  window.MF.applyTheme = applyTheme;
  window.MF.toggleTheme = toggleTheme;
  window.MF.getTheme = getStoredTheme;

  applyTheme(getStoredTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }

  window.addEventListener('mf:page-enter', initThemeToggle);
})();
