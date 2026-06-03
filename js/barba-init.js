/* ══════════════════════════════════════════════════════
   Barba.js — transitions fluides (cache home conservé)
   ══════════════════════════════════════════════════════ */

(function () {
  if (typeof barba === 'undefined') return;

  const transitionEl = document.getElementById('barba-transition');
  const transitionBg = transitionEl?.querySelector('.barba-transition__bg');
  const transitionTitle = transitionEl?.querySelector('.barba-transition__title');
  const transitionMeta = transitionEl?.querySelector('.barba-transition__meta');
  const transitionBar = transitionEl?.querySelector('.barba-transition__progress span');

  function getProjectFromTrigger(trigger) {
    const slug = trigger?.dataset?.projectTransition;
    if (!slug || !window.PROJECTS) return null;
    return window.PROJECTS[slug];
  }

  function setBodyPage(namespace) {
    document.body.classList.toggle('page-home', namespace === 'home');
    document.body.classList.toggle('page-project', namespace === 'project');
  }

  function ensureProjectCss() {
    if (document.getElementById('project-css')) return;
    const link = document.createElement('link');
    link.id = 'project-css';
    link.rel = 'stylesheet';
    link.href = 'css/project.css';
    document.head.appendChild(link);
  }

  function showTransition(project) {
    if (!transitionEl || !project) return gsap.timeline();
    if (transitionTitle) {
      const lines = project.titleLines || project.title.split(/\s+/);
      transitionTitle.innerHTML = lines
        .map((line) => `<span>${line}</span>`)
        .join('');
    }
    if (transitionMeta) transitionMeta.textContent = `// ${project.type.toLowerCase()}`;
    transitionEl.style.setProperty('--transition-accent', project.accent);
    transitionEl.classList.add('is-active');
    transitionEl.setAttribute('aria-hidden', 'false');

    gsap.set(transitionBg, { scaleY: 0, transformOrigin: 'top center' });
    gsap.set(transitionTitle, { yPercent: 30, opacity: 0 });
    gsap.set(transitionBar, { scaleX: 0, transformOrigin: 'left center' });

    return gsap.timeline()
      .to(transitionBg, { scaleY: 1, duration: 0.65, ease: 'expo.inOut' })
      .to(transitionTitle, { yPercent: 0, opacity: 1, duration: 0.75, ease: 'expo.out' }, '-=0.35')
      .to(transitionBar, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.5');
  }

  function hideTransition() {
    if (!transitionEl) return Promise.resolve();
    return gsap.timeline({
      onComplete() {
        transitionEl.classList.remove('is-active');
        transitionEl.setAttribute('aria-hidden', 'true');
      },
    })
      .to(transitionTitle, { yPercent: -40, opacity: 0, duration: 0.45, ease: 'power3.in' })
      .to(transitionBg, { scaleY: 0, transformOrigin: 'bottom center', duration: 0.55, ease: 'expo.inOut' }, '-=0.2');
  }

  function isHomeTopLink(el) {
    if (!el?.getAttribute) return false;
    const href = el.getAttribute('href') || '';
    const path = href.split('#')[0].replace(/^\.\//, '').replace(/^\.\.\//, '');
    const isHome = (
      path === '' ||
      path === '/' ||
      path === 'index.html' ||
      path.endsWith('/index.html')
    );
    if (!isHome) return false;
    return (
      el.classList.contains('nav__logo') ||
      el.classList.contains('footer__brand') ||
      el.classList.contains('project-cmd__logo') ||
      (el.classList.contains('nav__link') && !href.includes('#'))
    );
  }

  function enterHome(data) {
    const container = data.next.container;
    const trigger = data.trigger?.closest?.('a') || data.trigger;
    const scrollToTop = isHomeTopLink(trigger);
    const resumeOnly = !scrollToTop && container?.dataset?.mfScrollReady === '1';

    const revealHome = () => {
      setBodyPage('home');
      window.MF?.initHomeFromBarba?.({ resumeOnly, scrollToTop });
      return gsap.fromTo(
        data.next.container,
        { opacity: 0, y: resumeOnly ? 0 : -24 },
        {
          opacity: 1,
          y: 0,
          duration: resumeOnly ? 0.55 : 0.75,
          ease: 'expo.out',
          onComplete() {
            ScrollTrigger.refresh();
            window.dispatchEvent(
              new CustomEvent('mf:page-enter', { detail: { namespace: 'home', resumeOnly } })
            );
          },
        }
      );
    };

    if (transitionEl?.classList.contains('is-active')) {
      return hideTransition().then(revealHome);
    }
    return revealHome();
  }

  barba.init({
    preventRunning: true,
    cacheIgnore: false,
    transitions: [
      {
        name: 'home-to-project',
        from: { namespace: 'home' },
        to: { namespace: 'project' },
        async leave(data) {
          window.MF?.pauseHome?.();
          const project = getProjectFromTrigger(data.trigger);
          const tl = showTransition(project);
          await Promise.all([
            tl,
            gsap.to(data.current.container, {
              opacity: 0,
              y: -40,
              duration: 0.55,
              ease: 'power3.inOut',
            }),
          ]);
        },
        async enter(data) {
          setBodyPage('project');
          window.scrollTo(0, 0);
          window.__mfLenis?.scrollTo(0, { immediate: true });
          gsap.set(data.next.container, { opacity: 0 });
          await hideTransition();
          await gsap.to(data.next.container, {
            opacity: 1,
            duration: 0.35,
            ease: 'power2.out',
          });
          window.dispatchEvent(
            new CustomEvent('mf:page-enter', { detail: { namespace: 'project' } })
          );
        },
      },
      {
        name: 'project-to-project',
        from: { namespace: 'project' },
        to: { namespace: 'project' },
        async leave(data) {
          window.dispatchEvent(new CustomEvent('mf:page-leave'));
          const project = getProjectFromTrigger(data.trigger);
          const tl = showTransition(project);
          await Promise.all([
            tl,
            gsap.to(data.current.container, {
              opacity: 0,
              scale: 0.98,
              duration: 0.5,
              ease: 'power3.inOut',
            }),
          ]);
        },
        async enter(data) {
          window.scrollTo(0, 0);
          window.__mfLenis?.scrollTo(0, { immediate: true });
          gsap.set(data.next.container, { opacity: 0 });
          await hideTransition();
          await gsap.to(data.next.container, {
            opacity: 1,
            duration: 0.35,
            ease: 'power2.out',
          });
          window.dispatchEvent(
            new CustomEvent('mf:page-enter', { detail: { namespace: 'project' } })
          );
        },
      },
      {
        name: 'project-to-home',
        from: { namespace: 'project' },
        to: { namespace: 'home' },
        async leave(data) {
          window.dispatchEvent(new CustomEvent('mf:page-leave'));
          await gsap.to(data.current.container, {
            opacity: 0,
            y: 48,
            duration: 0.55,
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

  barba.hooks.after(() => {
    ScrollTrigger.refresh();
  });
})();
