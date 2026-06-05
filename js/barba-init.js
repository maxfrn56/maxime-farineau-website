/* ══════════════════════════════════════════════════════
   Barba.js — transitions fluides (cache home conservé)
   ══════════════════════════════════════════════════════ */

(function () {
  if (typeof barba === 'undefined') return;

  function setBodyPage(namespace) {
    document.body.classList.toggle('page-home', namespace === 'home');
    document.body.classList.toggle('page-project', namespace === 'project');
  }

  function getActiveBarbaContainer(namespace) {
    const list = Array.from(
      document.querySelectorAll(`[data-barba="container"][data-barba-namespace="${namespace}"]`)
    );
    return (
      list.find((el) => {
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
      }) ||
      list[list.length - 1] ||
      null
    );
  }

  function isHomeNavigationHref(href) {
    if (!href) return false;
    const path = href.split('#')[0].replace(/^\.\//, '').replace(/^\.\.\//, '');
    return (
      path === '' ||
      path === '/' ||
      path === 'index.html' ||
      path.endsWith('/index.html') ||
      path.endsWith('/index')
    );
  }

  window.MF = window.MF || {};
  window.MF.getActiveBarbaContainer = getActiveBarbaContainer;

  function ensureProjectCss() {
    if (document.getElementById('project-css')) return;
    const link = document.createElement('link');
    link.id = 'project-css';
    link.rel = 'stylesheet';
    link.href = '/css/project.css';
    document.head.appendChild(link);
  }

  function isHomeTopLink(el) {
    if (!el?.getAttribute) return false;
    const href = el.getAttribute('href') || '';
    if (!isHomeNavigationHref(href)) return false;
    return (
      el.classList.contains('nav__logo') ||
      el.classList.contains('footer__brand') ||
      el.classList.contains('project-cmd__logo') ||
      (el.classList.contains('nav__link') && !href.includes('#'))
    );
  }

  function revealProject(data) {
    window.scrollTo(0, 0);
    window.__mfLenis?.scrollTo(0, { immediate: true });
    gsap.set(data.next.container, { opacity: 0, y: 14 });
    return gsap.to(data.next.container, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    }).then(() => {
      window.dispatchEvent(
        new CustomEvent('mf:page-enter', {
          detail: { namespace: 'project', container: data.next.container },
        })
      );
    });
  }

  function enterHome(data) {
    const container = data.next.container || getActiveBarbaContainer('home');
    const trigger = data.trigger?.closest?.('a') || data.trigger;
    const scrollToTop = isHomeTopLink(trigger);
    const resumeOnly = !scrollToTop && container?.dataset?.mfScrollReady === '1';

    setBodyPage('home');
    window.MF?.initHomeFromBarba?.({ resumeOnly, scrollToTop });
    return gsap.fromTo(
      data.next.container,
      { opacity: 0, y: resumeOnly ? 0 : -20 },
      {
        opacity: 1,
        y: 0,
        duration: resumeOnly ? 0.5 : 0.6,
        ease: 'power2.out',
        onComplete() {
          window.MF?.revealHomeAfterBarba?.({ scrollToTop });
          ScrollTrigger.refresh(true);
          ScrollTrigger.update();
          window.dispatchEvent(
            new CustomEvent('mf:page-enter', { detail: { namespace: 'home', resumeOnly } })
          );
        },
      }
    );
  }

  barba.init({
    preventRunning: true,
    cacheIgnore: false,
    /* Depuis un projet : rechargement complet vers l’accueil (évite l’état Barba cassé) */
    prevent({ el }) {
      if (!document.body.classList.contains('page-project')) return false;
      const link = el.closest?.('a');
      if (!link) return false;
      if (!isHomeNavigationHref(link.getAttribute('href'))) return false;
      window.dispatchEvent(
        new CustomEvent('mf:page-leave', {
          detail: {
            namespace: 'project',
            container: getActiveBarbaContainer('project'),
          },
        })
      );
      return true;
    },
    transitions: [
      {
        name: 'home-to-project',
        from: { namespace: 'home' },
        to: { namespace: 'project' },
        async leave(data) {
          window.MF?.pauseHome?.();
          await gsap.to(data.current.container, {
            opacity: 0,
            y: -28,
            duration: 0.45,
            ease: 'power3.inOut',
          });
        },
        async enter(data) {
          setBodyPage('project');
          await revealProject(data);
        },
      },
      {
        name: 'project-to-project',
        from: { namespace: 'project' },
        to: { namespace: 'project' },
        async leave(data) {
          window.dispatchEvent(
            new CustomEvent('mf:page-leave', {
              detail: { namespace: 'project', container: data.current.container },
            })
          );
          await gsap.to(data.current.container, {
            opacity: 0,
            y: -12,
            duration: 0.38,
            ease: 'power2.inOut',
          });
        },
        async enter(data) {
          await revealProject(data);
        },
      },
      {
        name: 'project-to-home',
        from: { namespace: 'project' },
        to: { namespace: 'home' },
        async leave(data) {
          window.dispatchEvent(
            new CustomEvent('mf:page-leave', {
              detail: { namespace: 'project', container: data.current.container },
            })
          );
          await gsap.to(data.current.container, {
            opacity: 0,
            y: 32,
            duration: 0.45,
            ease: 'power3.inOut',
          });
        },
        enter: enterHome,
      },
    ],
  });

  barba.hooks.beforeEnter((data) => {
    setBodyPage(data.next.namespace);
    if (data.next.namespace === 'project') ensureProjectCss();
  });

  barba.hooks.afterEnter((data) => {
    if (data.next.namespace === 'home') {
      window.MF?.revealHomeAfterBarba?.({ scrollToTop: false });
    }
    ScrollTrigger.refresh(true);
  });

  barba.hooks.after(() => {
    ScrollTrigger.refresh();
  });
})();
