/* ══════════════════════════════════════════════════════
   MAXIME FARINEAU — main.js
   GSAP + ScrollTrigger + SplitType + Lenis
   ══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const navEntry = performance.getEntriesByType('navigation')[0];
  const isPageReload = navEntry?.type === 'reload';

  function resetHomeScroll() {
    window.__mfHomeScroll = 0;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.__mfLenis?.scrollTo(0, { immediate: true });
  }

  function isHomePage() {
    const c = document.querySelector('[data-barba="container"]');
    const ns = c?.getAttribute('data-barba-namespace');
    return !ns || ns === 'home';
  }

  /* ══════════════════════════════════════════════════
     GSAP SETUP
  ══════════════════════════════════════════════════ */
  gsap.registerPlugin(ScrollTrigger);

  const MOBILE_MQ = window.matchMedia('(max-width: 768px), (pointer: coarse)');

  function shouldUseNativeScroll() {
    return MOBILE_MQ.matches;
  }

  const useNativeScroll = shouldUseNativeScroll();
  window.__mfUseNativeScroll = useNativeScroll;

  ScrollTrigger.config({
    ignoreMobileResize: true,
    limitCallbacks: useNativeScroll,
    autoRefreshEvents: useNativeScroll ? 'visibilitychange,DOMContentLoaded,load' : 'visibilitychange,DOMContentLoaded,load,resize',
  });

  let scrollTriggerUpdateQueued = false;
  let scrollEndTimer = 0;
  function scheduleScrollTriggerUpdate() {
    if (scrollTriggerUpdateQueued) return;
    scrollTriggerUpdateQueued = true;
    requestAnimationFrame(() => {
      scrollTriggerUpdateQueued = false;
      ScrollTrigger.update();
    });

    if (useNativeScroll) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        ScrollTrigger.update();
      }, 120);
    }
  }

  function createNativeScrollController() {
    let scrollY = window.scrollY;
    const listeners = [];

    const api = {
      get scroll() { return scrollY; },
      start() {},
      stop() {},
      raf() {},
      on(event, cb) {
        if (event === 'scroll') listeners.push(cb);
      },
      scrollTo(target, opts = {}) {
        const offset = opts.offset ?? 0;
        const immediate = opts.immediate ?? false;
        let top = 0;

        if (typeof target === 'number') {
          top = target;
        } else if (target instanceof Element) {
          top = target.getBoundingClientRect().top + window.scrollY + offset;
        }

        top = Math.max(0, top);
        window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });

        scrollY = top;
        listeners.forEach((cb) => cb({ scroll: scrollY }));
        scheduleScrollTriggerUpdate();
      },
    };

    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
      listeners.forEach((cb) => cb({ scroll: scrollY }));
      scheduleScrollTriggerUpdate();
    }, { passive: true });

    return api;
  }

  /* ══════════════════════════════════════════════════
     LENIS SMOOTH SCROLL (desktop) / scroll natif (mobile)
  ══════════════════════════════════════════════════ */
  const lenis = useNativeScroll
    ? createNativeScrollController()
    : new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
      });

  window.__mfLenis = lenis;

  if (!useNativeScroll) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  if (!isHomePage()) {
    lenis.stop();
    document.documentElement.classList.add('is-project-view');
    initGlobalFeatures(lenis);
    return;
  }

  // Stop scroll during preloader (home only)
  lenis.stop();

  /* ══════════════════════════════════════════════════
     UTILITY
  ══════════════════════════════════════════════════ */
  const lerp = (a, b, n) => a + (b - a) * n;


  /* ══════════════════════════════════════════════════
     PRELOADER
  ══════════════════════════════════════════════════ */
  const preloader     = document.getElementById('preloader');
  const counterEl     = document.getElementById('preloader-counter');
  const progressBar   = document.getElementById('preloader-bar');
  const preloaderName = document.querySelector('.preloader__name');

  const counterObj = { val: 0 };
  const skipPreloader = !isPageReload && sessionStorage.getItem('mf-home-ready') === '1';

  if (!skipPreloader) {
    document.documentElement.classList.add('is-preloading');
    resetHomeScroll();
  }

  if (skipPreloader && preloader) {
    preloader.style.display = 'none';
    document.documentElement.classList.remove('is-preloading');
    resetHomeScroll();
    lenis.start();
    document.body.classList.add('mf-home-ready');
  }

  if (!skipPreloader) {
    const preloaderScrollLock = () => resetHomeScroll();
    window.addEventListener('scroll', preloaderScrollLock, { passive: true });

    gsap.timeline({
      onComplete() {
        window.removeEventListener('scroll', preloaderScrollLock);
        exitPreloader();
      },
    })
    .to(progressBar, {
      width: '100%',
      duration: 2.5,
      ease: 'power2.inOut',
    }, 0)
    .to(counterObj, {
      val: 100,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate() {
        if (!counterEl) return;
        const v = Math.round(counterObj.val);
        counterEl.textContent = v < 10 ? '0' + v : String(v);
      },
    }, 0)
    .to(preloaderName, {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1,
      ease: 'power3.out',
    }, 0.9)
    .to({}, { duration: 0.2 });
  }

  function exitPreloader() {
    sessionStorage.setItem('mf-home-ready', '1');
    document.body.classList.add('mf-home-ready');
    document.documentElement.classList.remove('is-preloading');

    let heroStarted = false;
    const startHero = async () => {
      if (heroStarted) return;
      heroStarted = true;
      await whenFontsReady();
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      refitHeroLayout(true);
      playHeroEntrance();
    };

    gsap.timeline({
      onComplete() {
        if (preloader) preloader.style.display = 'none';
        resetHomeScroll();
        lenis.start();
        startHero();
      },
    })
    .to('.preloader__counter-wrap, .preloader__label, .preloader__progress, .preloader__name', {
      opacity: 0,
      duration: 0.28,
      stagger: 0.04,
      ease: 'power2.in',
    })
    .to(preloader, {
      yPercent: -100,
      duration: 0.75,
      ease: 'expo.inOut',
    }, '-=0.18');
  }

  /* ══════════════════════════════════════════════════
     HERO ENTRANCE — grand titre → rétrécit vers gauche
  ══════════════════════════════════════════════════ */

  const isDesktop = window.innerWidth > 900;

  // 1. Split les chars et les cache IMMÉDIATEMENT (pendant le préloader)
  //    → y + opacity pour ne pas dépendre de overflow:hidden sur hero__line
  const heroLines    = document.querySelectorAll('.hero__line[data-split]');
  const allHeroChars = [];
  heroLines.forEach(line => {
    const split = new SplitType(line, { types: 'chars' });
    gsap.set(split.chars, { y: 56, opacity: 0 });
    allHeroChars.push(...split.chars);
  });

  // 2. États initiaux — uniquement opacity + transform (pas de layout)
  gsap.set('#nav',          { opacity: 0, y: -12 });
  gsap.set('.hero__tag',    { opacity: 0, y: 12  });
  gsap.set('.hero__footer', { opacity: 0, y: 20  });
  gsap.set('.hero__location', { opacity: 0, y: 10 });
  gsap.set('.hero__intro',  { opacity: 0, x: 40  });

  // 2b. Nom élastique — fit + letter-spacing + split + masquer pour l'entrée
  const heroNameEls = document.querySelectorAll('.js-hero-name');   // MAXIME + FARINEAU
  const heroNameBar = document.querySelector('.hero__name-bar');
  const heroNameImg = document.querySelector('.js-hero-name-imgs');
  let   nameChars   = [];

  function fitHeroName() {
    if (!heroNameEls.length || !heroNameBar) return;
    const padL   = parseFloat(getComputedStyle(heroNameBar).paddingLeft)  || 0;
    const padR   = parseFloat(getComputedStyle(heroNameBar).paddingRight) || 0;
    const barW   = heroNameBar.getBoundingClientRect().width;
    const availW = barW - padL - padR;

    // Reset pour mesure naturelle
    heroNameEls.forEach(el => {
      el.style.fontSize     = '100px';
      el.style.letterSpacing = 'normal';
    });

    const imgW = heroNameImg ? heroNameImg.getBoundingClientRect().width : availW * 0.09;
    const GAP  = parseFloat(getComputedStyle(document.querySelector('.hero__name-row') || document.body).gap) || 16;
    const textAvail = availW - imgW - GAP * 2;

    // Largeurs naturelles à 100px
    const firstNatW = heroNameEls[0].getBoundingClientRect().width;
    const lastNatW  = heroNameEls[1] ? heroNameEls[1].getBoundingClientRect().width : 0;
    const totalNatW = firstNatW + lastNatW;
    if (!totalNatW) return;

    // Font-size pour que les deux mots remplissent l'espace disponible
    const fSize = 100 * textAvail / totalNatW;
    heroNameEls.forEach(el => { el.style.fontSize = fSize + 'px'; });

    // Largeurs après font-size ajusté
    const f2 = heroNameEls[0].getBoundingClientRect().width;
    const l2 = heroNameEls[1] ? heroNameEls[1].getBoundingClientRect().width : 0;

    // Allocation proportionnelle (lettre-espacement pour remplir exactement)
    const firstAlloc = textAvail * (f2 / (f2 + l2));
    const lastAlloc  = textAvail - firstAlloc;

    const firstChars = heroNameEls[0].textContent.length;
    const lastChars  = heroNameEls[1] ? heroNameEls[1].textContent.length : 1;

    heroNameEls[0].style.letterSpacing = ((firstAlloc - f2) / firstChars) + 'px';
    if (heroNameEls[1]) {
      heroNameEls[1].style.letterSpacing = ((lastAlloc  - l2) / lastChars)  + 'px';
    }
  }

  function whenFontsReady() {
    return document.fonts?.ready ?? Promise.resolve();
  }

  function measureHeroInitScale() {
    if (!isDesktop || !heroTitleWrap || !heroTitleEl) return 1;
    const wrapLeft = heroTitleWrap.getBoundingClientRect().left;
    let maxTextW = 0;
    document.querySelectorAll('.hero__line[data-split]').forEach((ln) => {
      const prev = ln.style.display;
      ln.style.display = 'inline-block';
      maxTextW = Math.max(maxTextW, ln.getBoundingClientRect().width);
      ln.style.display = prev || '';
    });
    if (!maxTextW) maxTextW = heroTitleWrap.getBoundingClientRect().width;
    return Math.min((window.innerWidth - wrapLeft) / maxTextW, 2.2) * 0.94;
  }

  function applyHeroInitScale() {
    heroInitScale = measureHeroInitScale();
    if (isDesktop && heroTitleEl) {
      gsap.set(heroTitleEl, {
        scale: heroInitScale,
        transformOrigin: 'left center',
      });
    }
  }

  function settleHeroTitle() {
    if (!heroTitleEl) return;
    gsap.set(heroTitleEl, {
      scale: 1,
      transformOrigin: 'left center',
      clearProps: 'transform',
    });
  }

  function refitHeroLayout(forEntrance = false) {
    fitHeroName();
    if (forEntrance && isDesktop) {
      applyHeroInitScale();
    } else {
      settleHeroTitle();
    }
    ScrollTrigger.refresh();
  }

  fitHeroName();
  window.addEventListener('resize', () => {
    refitHeroLayout(!document.body.classList.contains('mf-home-ready'));
  });

  if (heroNameEls.length) {
    heroNameEls.forEach(el => {
      const s = new SplitType(el, { types: 'chars' });
      nameChars.push(...(s.chars || []));
    });
    gsap.set(nameChars, { y: '110%', opacity: 0 });
    if (heroNameBar) gsap.set(heroNameBar, { opacity: 1 });
    if (heroNameImg) gsap.set(heroNameImg, { opacity: 0, scale: 0.92, transformOrigin: 'center center' });
  }

  // 3. Desktop : scale initial → titre remplit le viewport, se rétrécitera ensuite
  const heroTitleEl   = document.querySelector('.hero__title');
  const heroTitleWrap = document.querySelector('.hero__title-wrap');
  let heroInitScale = 1;

  if (!skipPreloader) {
    applyHeroInitScale();
    whenFontsReady().then(() => refitHeroLayout(true));
  }

  /* ── Hero preview : zoom au survol ── */
  (function initHeroImgHover() {
    const hero = document.getElementById('hero');
    const imgs = document.querySelector('.js-hero-name-imgs');
    if (!hero || !imgs) return;

    const scaleHover = window.innerWidth > 900 ? 2.35 : 2.05;
    const hoverMargin = 20;

    function computeHoverLift() {
      const rect = imgs.getBoundingClientRect();
      const scaledH = rect.height * scaleHover;
      const newTop = rect.bottom - scaledH;
      const lift = Math.max(0, hoverMargin - newTop);
      return -lift;
    }

    imgs.addEventListener('pointerenter', () => {
      hero.classList.add('is-img-hover');
      gsap.to(imgs, {
        scale: scaleHover,
        y: computeHoverLift(),
        transformOrigin: '50% 100%',
        duration: 0.55,
        ease: 'expo.out',
        force3D: true,
        overwrite: 'auto',
      });
    });

    imgs.addEventListener('pointerleave', () => {
      hero.classList.remove('is-img-hover');
      gsap.to(imgs, {
        scale: 1,
        y: 0,
        transformOrigin: '50% 50%',
        duration: 0.7,
        ease: 'elastic.out(1, 0.45)',
        force3D: true,
        overwrite: 'auto',
      });
    });
  })();

  function playHeroEntrance() {
    resetHomeScroll();
    const tl = gsap.timeline({
      onComplete() {
        initScrollWorld();
        requestAnimationFrame(() => ScrollTrigger.refresh());
      },
    });

    // Phase 1 — nav apparaît, chars montent dans le GRAND titre
    tl.to('#nav', { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
      .to(allHeroChars, {
        y: 0, opacity: 1,
        duration: 0.68,
        stagger: 0.012,
        ease: 'expo.out',
      }, '-=0.38');

    if (isDesktop) {
      // Phase 2 — pause puis le titre rétrécit vers la gauche + tout se révèle
      tl.to(heroTitleEl, {
            scale: 1,
            transformOrigin: 'left center',
            duration: 0.95,
            ease: 'expo.inOut',
          }, '+=0.32')
        .to('.hero__intro',  { opacity: 1, x: 0, duration: 1.0, ease: 'expo.out'   }, '<+=0.1')
        .to('.hero__tag',    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '<')
        .to('.hero__footer', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '<+=0.15');

      // Phase 3 — nom + image projet (en même temps)
      if (nameChars.length) {
        tl.to(nameChars, {
          y: '0%', opacity: 1,
          duration: 1.0,
          stagger: 0.022,
          ease: 'expo.out',
        }, '<+=0.2');
      }
      if (heroNameImg) {
        tl.to(heroNameImg, {
          opacity: 1,
          scale: 1,
          duration: 1.0,
          ease: 'expo.out',
          onStart: () => heroNameImg.classList.add('is-revealed'),
        }, '<');
      }
      tl.to('.hero__location', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5');
    } else {
      tl.to('.hero__tag',    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
        .to('.hero__footer', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
        .to('.hero__intro',  { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out'   }, '-=0.4');
      if (nameChars.length) {
        tl.to(nameChars, { y: '0%', opacity: 1, duration: 0.9, stagger: 0.02, ease: 'expo.out' }, '-=0.5');
      }
      if (heroNameImg) {
        tl.to(heroNameImg, {
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'expo.out',
          onStart: () => heroNameImg.classList.add('is-revealed'),
        }, '<');
      }
      tl.to('.hero__location', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');
    }
  }

  /* ══════════════════════════════════════════════════
     SCROLL WORLD — All ScrollTrigger animations
  ══════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════
     CODE BLOCK TYPER
  ══════════════════════════════════════════════════ */
  function initCodeTyper(codeBlock) {
    const codeEl = codeBlock.querySelector('.js-code-typing');
    const pre    = codeEl?.closest('pre');
    const body   = codeBlock.querySelector('.code-block__body');
    if (!codeEl || !pre) return;

    /* Mobile : code statique — le typer reflow le layout et fait sauter le scroll */
    if (useNativeScroll) {
      const fullH = pre.offsetHeight;
      if (fullH > 0) {
        body?.style.setProperty('--code-block-h', `${fullH}px`);
        body?.classList.add('is-static');
      }
      return;
    }

    const chunks     = [];
    const stringDefs = [];

    function walk(node, classes = []) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const char of node.textContent) {
          chunks.push({ char, classes: [...classes] });
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const cls = node.classList[0] || '';
      const next = cls ? [...classes, cls] : classes;

      if (cls === 'tok-str') {
        const inner  = node.textContent.replace(/^"|"$/g, '');
        const strIdx = stringDefs.length;
        stringDefs.push({ inner, el: null });
        const quoted = `"${inner}"`;
        for (let i = 0; i < quoted.length; i++) {
          chunks.push({ char: quoted[i], classes: ['tok-str'], strIdx });
        }
        return;
      }

      node.childNodes.forEach((child) => walk(child, next));
    }

    codeEl.childNodes.forEach((n) => walk(n));

    const cursor = document.createElement('span');
    cursor.className = 'code-block__cursor';
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');

    const TYPE_MS     = 24;
    const ERASE_MS    = 20;
    const STR_TYPE_MS = 28;
    const wait        = (ms) => new Promise((r) => setTimeout(r, ms));
    const typeJitter  = () => TYPE_MS + Math.random() * 14;

    function parkCursor() {
      if (cursor.parentNode !== pre) pre.appendChild(cursor);
    }

    async function typeChunks() {
      codeEl.innerHTML = '';
      stringDefs.forEach((s) => { s.el = null; });

      let curSpan      = null;
      let curKey       = '';
      let lastTextNode = null;

      for (const ch of chunks) {
        const key = ch.classes.join(',') || '_plain';

        if (key !== curKey) {
          if (ch.classes.length) {
            curSpan = document.createElement('span');
            ch.classes.forEach((c) => curSpan.classList.add(c));
            codeEl.appendChild(curSpan);
            lastTextNode = null;
          } else {
            curSpan = null;
            lastTextNode = document.createTextNode('');
            codeEl.appendChild(lastTextNode);
          }
          curKey = key;
        }

        if (curSpan) {
          curSpan.textContent += ch.char;
          if (ch.strIdx !== undefined) stringDefs[ch.strIdx].el = curSpan;
        } else if (lastTextNode) {
          lastTextNode.textContent += ch.char;
        }

        parkCursor();
        await wait(typeJitter());
      }
    }

    async function eraseStrings() {
      const list = [...stringDefs].reverse();
      for (const { el, inner } of list) {
        if (!el) continue;
        for (let i = inner.length; i >= 0; i--) {
          el.textContent = `"${inner.slice(0, i)}"`;
          parkCursor();
          await wait(ERASE_MS + Math.random() * 8);
        }
      }
    }

    async function typeStrings() {
      for (const { el, inner } of stringDefs) {
        if (!el) continue;
        for (let i = 0; i <= inner.length; i++) {
          el.textContent = `"${inner.slice(0, i)}"`;
          parkCursor();
          await wait(STR_TYPE_MS + Math.random() * 10);
        }
      }
    }

    async function runLoop() {
      await typeChunks();
      await wait(1000);

      while (true) {
        await eraseStrings();
        await wait(400);
        await typeStrings();
        await wait(1200);
      }
    }

    runLoop();
  }

  let homeScrollWorldInit = false;

  function revealHomeAfterBarba({ scrollToTop = false } = {}) {
    const container =
      window.MF?.getActiveBarbaContainer?.('home') ||
      document.querySelector('[data-barba-namespace="home"]');
    if (!container) return;

    gsap.set(container, { opacity: 1, y: 0, visibility: 'visible', clearProps: 'transform' });
    gsap.set('#nav', { opacity: 1, y: 0, clearProps: 'transform' });

    const reveal = (sel, props) => {
      container.querySelectorAll(sel).forEach((el) => gsap.set(el, props));
    };

    reveal('.hero__line .char, .js-hero-name .char', { opacity: 1, y: 0, yPercent: 0, clearProps: 'transform' });
    reveal('.js-reveal-title .char', { opacity: 1, yPercent: 0, clearProps: 'transform' });
    reveal('.section__meta', { opacity: 1, y: 0, clearProps: 'transform' });
    reveal('.statement__word', { opacity: 1, y: 0, clearProps: 'transform' });
    reveal('.about__statement', { opacity: 1, y: 0, clearProps: 'transform' });
    reveal('.cta-wide', { opacity: 1, y: 0, clearProps: 'transform' });
    reveal('.code-block', { opacity: 1, x: 0, clearProps: 'transform' });
    reveal('.contact__footer', { opacity: 1, y: 0, clearProps: 'transform' });

    gsap.set(container.querySelectorAll('.hero__tag, .hero__footer, .hero__location, .hero__intro'), {
      opacity: 1, x: 0, y: 0, clearProps: 'transform',
    });

    const heroTitle = container.querySelector('.hero__title');
    if (heroTitle) gsap.set(heroTitle, { opacity: 1, scale: 1, clearProps: 'transform' });

    const heroNameImg = container.querySelector('.js-hero-name-imgs');
    if (heroNameImg) {
      gsap.set(heroNameImg, { opacity: 1, scale: 1, clearProps: 'transform' });
      heroNameImg.classList.add('is-revealed');
    }

    const consoleEl = container.querySelector('#services-console');
    if (consoleEl) gsap.set(consoleEl, { opacity: 1, y: 0, clearProps: 'transform' });

    const worksMount = container.querySelector('#roulette-preview');
    if (worksMount && !worksMount.children.length) {
      window.MF?.rebuildWorksCards?.(worksMount);
    }

    if (scrollToTop) {
      gsap.killTweensOf(document.body);
      document.body.setAttribute('data-theme', 'dark');
      gsap.set(document.body, { backgroundColor: '#0A0A0A', color: '#F0EDE6' });
    }

    requestAnimationFrame(() => {
      ScrollTrigger.refresh(true);
      ScrollTrigger.update();
    });
  }

  function restoreHomeEnvironment({ scrollToTop = false } = {}) {
    document.documentElement.classList.remove('is-project-view');
    document.body.style.removeProperty('--project-accent');
    document.body.classList.remove('page-project');
    document.body.classList.add('page-home');
    document.getElementById('nav')?.classList.remove('is-scrolled');

    ScrollTrigger.enable();
    window.__mfLenis?.start();

    if (scrollToTop) {
      window.__mfHomeScroll = 0;
      resetHomeScroll();
    }

    revealHomeAfterBarba({ scrollToTop });
  }

  function initScrollWorld() {
    ScrollTrigger.enable();
    window.__mfLenis?.start();

    if (homeScrollWorldInit) {
      restoreHomeEnvironment({ scrollToTop: true });
      return;
    }
    homeScrollWorldInit = true;

    resetHomeScroll();

    /* ── Nav scrolled state ── */
    const nav = document.getElementById('nav');

    ScrollTrigger.create({
      start: 'top top-=60',
      end: 99999,
      onEnter:     () => nav.classList.add('is-scrolled'),
      onLeaveBack: () => nav.classList.remove('is-scrolled'),
    });

    /* ── Hero name elastic (skew + scaleX, gsap.set — évite conflits entre quickSetters) ── */
    (function initNameElastic() {
      const nameBar  = document.querySelector('.hero__name-bar');
      const imgCards = document.querySelectorAll('.hero__name-card');
      if (!nameBar) return;

      const chars = gsap.utils.toArray('.hero__name .char');
      if (!chars.length) return;

      let mouseX     = window.innerWidth * 0.5;
      let lastMouseX = mouseX;
      let velX       = 0;
      let smoothVel  = 0;
      let isInBar    = false;
      let activeImg  = 0;
      let tickerOn   = false;

      const nameTexts = nameBar.querySelectorAll('.js-hero-name');
      const imgsWrap  = nameBar.querySelector('.js-hero-name-imgs');
      const N         = imgCards.length;

      function getProjectIndex(clientX) {
        if (!N) return 0;

        /* Sur l'image : les 5 projets répartis sur sa largeur */
        if (imgsWrap) {
          const ir = imgsWrap.getBoundingClientRect();
          if (clientX >= ir.left && clientX <= ir.right) {
            const t = (clientX - ir.left) / (ir.width || 1);
            return Math.min(N - 1, Math.floor(t * N));
          }
        }

        /* MAXIME → projets 0–1, FARINEAU → projets 2–4 */
        if (nameTexts.length >= 2) {
          const mRect = nameTexts[0].getBoundingClientRect();
          const fRect = nameTexts[1].getBoundingClientRect();

          if (clientX <= mRect.right + 12) {
            const t = (clientX - mRect.left) / (mRect.width || 1);
            return Math.min(1, Math.floor(t * 2));
          }
          if (clientX >= fRect.left - 12) {
            const t = (clientX - fRect.left) / (fRect.width || 1);
            return Math.min(N - 1, 2 + Math.floor(t * (N - 2)));
          }
        }

        const barRect = nameBar.getBoundingClientRect();
        return Math.min(N - 1, Math.floor(((clientX - barRect.left) / (barRect.width || 1)) * N));
      }

      function switchImg(idx) {
        idx = Math.max(0, Math.min(N - 1, idx));
        if (idx === activeImg || !imgCards.length) return;
        imgCards[activeImg]?.classList.remove('is-active');
        imgCards[idx]?.classList.add('is-active');
        activeImg = idx;
        document.dispatchEvent(new CustomEvent('hero-card-change', { detail: { idx } }));
      }

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function updateNameDistortion() {
        const barRect = nameBar.getBoundingClientRect();
        const mx      = mouseX;

        smoothVel = lerp(smoothVel, velX, 0.38);
        velX *= 0.84;

        const sigma = Math.max(barRect.width * 0.09, 72);

        for (let i = 0; i < chars.length; i++) {
          const el = chars[i];
          const r  = el.getBoundingClientRect();
          if (r.width < 1 && r.height < 1) continue;

          const cx   = r.left + r.width * 0.5;
          const dx   = mx - cx;
          const infl = Math.exp(-(dx * dx) / (2 * sigma * sigma));

          const vSkew  = smoothVel * 0.85 * infl;
          const vScale = 1 + Math.min(Math.abs(smoothVel) * 0.007 * infl, 0.52);

          const barT  = (mx - barRect.left) / (barRect.width || 1);
          const charT = (cx - barRect.left) / (barRect.width || 1);
          const shear = (barT - charT) * 34;

          const rubber = dx * 0.072;

          const skewX  = gsap.utils.clamp(-38, 38, vSkew + shear * 0.42 + rubber);
          const scaleX = gsap.utils.clamp(0.62, 1.58, vScale + Math.abs(dx) * 0.00035);

          gsap.set(el, { skewX, scaleX, force3D: true });
        }
      }

      function tick() {
        if (!isInBar) {
          gsap.ticker.remove(tick);
          tickerOn = false;
          return;
        }
        updateNameDistortion();
      }

      function ensureTicker() {
        if (tickerOn) return;
        tickerOn = true;
        gsap.ticker.add(tick);
      }

      function onPointerMove(e) {
        const nx = e.clientX;
        velX += nx - lastMouseX;
        lastMouseX = nx;
        mouseX = nx;

        switchImg(getProjectIndex(nx));

        if (isInBar) {
          ensureTicker();
          updateNameDistortion();
        }
      }

      nameBar.addEventListener('pointermove', onPointerMove, { passive: true });

      nameBar.addEventListener('pointerenter', e => {
        isInBar = true;
        lastMouseX = mouseX = e.clientX;
        velX = 0;
        smoothVel = 0;
        ensureTicker();
        updateNameDistortion();
      });

      nameBar.addEventListener('pointerleave', () => {
        isInBar = false;
        velX = 0;
        smoothVel = 0;
        gsap.ticker.remove(tick);
        tickerOn = false;
        gsap.to(chars, {
          skewX:    0,
          scaleX:   1,
          duration: 1.15,
          ease:     'elastic.out(1, 0.42)',
          stagger:  { each: 0.02, from: 'center' },
          overwrite: true,
        });
      });
    })();

    /* ── Hero parallax (desktop — scrub désactivé sur mobile) ── */
    if (!shouldUseNativeScroll()) {
      gsap.to('.hero__title', {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end:   'bottom top',
          scrub: 1.5,
        },
      });
      gsap.to('.hero__tag', {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end:   'bottom top',
          scrub: 1.5,
        },
      });
    }

    /* ── Section meta tags ── */
    document.querySelectorAll('.section__meta').forEach(el => {
      if (useNativeScroll) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(el, { opacity: 0, y: 10 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }),
      });
    });

    /* ── Section titles ── */
    document.querySelectorAll('.js-reveal-title').forEach(el => {
      if (useNativeScroll) {
        gsap.set(el, { opacity: 1 });
        return;
      }
      const split = new SplitType(el, { types: 'chars' });
      gsap.set(split.chars, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(split.chars, {
            yPercent: 0,
            duration: 0.9,
            stagger: 0.018,
            ease: 'expo.out',
          });
        },
      });
    });

    /* ══════════════════════════════════════════════════
       STATEMENT — Split-flap (airport board) animation
    ══════════════════════════════════════════════════ */
    (function initSplitFlap() {
      const rows = document.querySelectorAll('.statement__row');
      if (!rows.length) return;

      if (useNativeScroll) {
        rows.forEach((row) => {
          const span = row.querySelector('.statement__row-text');
          const text = row.getAttribute('data-flip') || '';
          if (span) span.textContent = text;
        });
        return;
      }

      const SEQ  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,&!? ';
      const STEP = 50;  // ms par tick de flip
      const COL  = 2;   // ticks de décalage entre colonnes
      const L    = 27;  // longueur fixe de chaque ligne
      const HOLD_MS = 3000; // temps d'affixation par phrase (EN / FR)
      const FLIP_DURATION = (L - 1) * COL * STEP + SEQ.length * STEP;

      function pad(str) {
        return (str + ' '.repeat(L)).slice(0, L);
      }

      const PHRASES = [
        // Phrase A — anglais
        [
          pad('I WORK WITH AMBITIOUS'),
          pad('ENTREPRENEURS & COMPANIES'),
          pad('TO CREATE WEBSITES AND APPS'),
          pad('THAT MAKE A DIFFERENCE.'),
        ],
        // Phrase B — français sans accent
        [
          pad('DEVELOPPEUR FULL STACK,'),
          pad('JE TRADUIS VOS VALEURS'),
          pad('EN SITES SUR MESURE.'),
          pad('ACCOMPAGNEMENT UNIQUE.'),
        ],
      ];

      // Pré-initialise chaque span avec des espaces
      rows.forEach((row, i) => {
        const span = row.querySelector('.statement__row-text');
        if (span) span.textContent = ' '.repeat(L);
      });

      function seqIdx(ch) {
        const idx = SEQ.indexOf(ch.toUpperCase());
        return idx >= 0 ? idx : SEQ.length - 1; // fallback sur espace
      }

      function flipRow(rowEl, target) {
        const span = rowEl.querySelector('.statement__row-text');
        if (!span) return;

        const src  = (span.textContent + ' '.repeat(L)).slice(0, L);
        const tgt  = pad(target);
        const chars = src.split('');

        for (let i = 0; i < L; i++) {
          const idx  = i;
          const from = src[idx] || ' ';
          const to   = tgt[idx] || ' ';
          if (from === to) continue;

          const fi    = seqIdx(from);
          const ti    = seqIdx(to);
          const steps = ((ti - fi) + SEQ.length) % SEQ.length || SEQ.length;

          const startDelay = idx * COL * STEP;
          let   tick = 0;

          setTimeout(() => {
            const iv = setInterval(() => {
              tick++;
              if (tick >= steps) {
                // Écriture du caractère final exact
                chars[idx] = to;
                span.textContent = chars.join('');
                clearInterval(iv);
              } else {
                chars[idx] = SEQ[(fi + tick) % SEQ.length];
                span.textContent = chars.join('');
              }
            }, STEP);
          }, startDelay);
        }
      }

      function flipPhrase(idx) {
        const phrase = PHRASES[idx];
        rows.forEach((row, i) => {
          if (phrase[i] !== undefined) flipRow(row, phrase[i]);
        });
      }

      let current     = 0;
      let triggered   = false;
      let cycleTimer  = null;

      function scheduleNext() {
        cycleTimer = setTimeout(() => {
          current = (current + 1) % PHRASES.length;
          flipPhrase(current);
          scheduleNext();
        }, FLIP_DURATION + HOLD_MS);
      }

      function startCycle() {
        if (cycleTimer) return;
        scheduleNext();
      }

      ScrollTrigger.create({
        trigger: '#statement',
        start: 'top 70%',
        onEnter: () => {
          if (!triggered) {
            triggered = true;
            flipPhrase(0);
            setTimeout(startCycle, FLIP_DURATION + HOLD_MS);
          }
        },
      });
    })();

    /* ══════════════════════════════════════════════════
       WORKS ROULETTE
    ══════════════════════════════════════════════════ */
    (function initRoulette() {
      const track   = document.getElementById('roulette-track');
      const items   = document.querySelectorAll('.roulette__item');
      const cards   = document.querySelectorAll('.roulette__card');
      const counter = document.getElementById('roulette-count');
      const N = items.length;
      if (!track || !N) return;

      let activeIdx = -1;

      function switchCard(idx) {
        if (idx === activeIdx) return;
        cards.forEach((c) => c.classList.remove('is-active'));
        items.forEach((it) => it.classList.remove('is-active'));
        const card = document.querySelector(`.roulette__card[data-idx="${idx}"]`);
        if (card) card.classList.add('is-active');
        items[idx] && items[idx].classList.add('is-active');
        if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
        activeIdx = idx;
      }

      if (shouldUseNativeScroll()) {
        gsap.set(track, { clearProps: 'transform' });
        items.forEach((item) => gsap.set(item, { clearProps: 'transform,opacity' }));
        switchCard(0);

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const idx = Number(entry.target.dataset.idx);
            if (!Number.isNaN(idx)) switchCard(idx);
          });
        }, {
          root: null,
          threshold: 0.55,
          rootMargin: '-35% 0px -35% 0px',
        });

        items.forEach((item) => observer.observe(item));
        return;
      }

      const ITEM_H = items[0].getBoundingClientRect().height;

      function getSlot(progress) {
        return Math.min(Math.max(progress * (N - 1), 0), N - 1);
      }

      function getTrackY(slot) {
        const viewH  = track.closest('.roulette__left').getBoundingClientRect().height;
        const center = viewH / 2 - ITEM_H / 2;
        return center - slot * ITEM_H;
      }

      function styleItems(slot) {
        items.forEach((item, i) => {
          const dist = i - slot;
          const absDist = Math.abs(dist);
          const opacity = Math.max(0, 1 - absDist * 0.45);
          const scale   = 1 - absDist * 0.04;
          const arcX    = -(dist * dist) * 22;
          gsap.set(item, { opacity, scale, x: arcX, transformOrigin: 'left center' });
        });
      }

      gsap.set(track, { y: getTrackY(0) });
      styleItems(0);
      switchCard(0);

      ScrollTrigger.create({
        trigger: '#works',
        start: 'top top',
        end:   `+=${(N - 1) * 70}%`,
        pin:   true,
        anticipatePin: 1,
        scrub: 0.8,
        onUpdate: (self) => {
          const slot = getSlot(self.progress);
          const y    = getTrackY(slot);
          gsap.to(track, { y, duration: 0.4, ease: 'power2.out', overwrite: true });
          styleItems(slot);
          switchCard(Math.round(slot));
        },
      });
    })();

    /* ── About statement ── */
    const aboutStatement = document.querySelector('.about__statement');
    if (aboutStatement) {
      if (useNativeScroll) {
        gsap.set(aboutStatement, { opacity: 1, y: 0 });
      } else {
        const split = new SplitType(aboutStatement, { types: 'words' });
        gsap.set(split.words, { opacity: 0, y: 16 });
        ScrollTrigger.create({
          trigger: aboutStatement,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(split.words, {
              opacity: 1, y: 0,
              duration: 0.6,
              stagger: 0.05,
              ease: 'power3.out',
            });
          },
        });
      }
    }

    /* ── About wide CTA ── */
    const ctaWide = document.querySelector('.cta-wide');
    if (ctaWide) {
      if (useNativeScroll) {
        gsap.set(ctaWide, { opacity: 1, y: 0 });
      } else {
        gsap.set(ctaWide, { opacity: 0, y: 20 });
        ScrollTrigger.create({
          trigger: ctaWide,
          start: 'top 90%',
          once: true,
          onEnter: () => gsap.to(ctaWide, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }),
        });
      }
    }

    /* ── About body / tags ── */
    ['.about__body', '.about__tags'].forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (useNativeScroll) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(el, { opacity: 0, y: 14 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }),
      });
    });

    /* ── Code block — machine à écrire + boucle sur les strings ── */
    const codeBlock = document.querySelector('.code-block');
    if (codeBlock) {
      if (useNativeScroll) {
        gsap.set(codeBlock, { opacity: 1, x: 0 });
        initCodeTyper(codeBlock);
      } else {
        gsap.set(codeBlock, { opacity: 0, x: 40 });
        let codeTyperStarted = false;
        ScrollTrigger.create({
          trigger: codeBlock,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(codeBlock, { opacity: 1, x: 0, duration: 0.65, ease: 'power3.out' });
            if (!codeTyperStarted) {
              codeTyperStarted = true;
              initCodeTyper(codeBlock);
            }
          },
        });
      }
    }

    /* ── Contact title ── */
    document.querySelectorAll('.contact__line[data-split]').forEach(line => {
      if (useNativeScroll) {
        gsap.set(line, { opacity: 1 });
        return;
      }
      const split = new SplitType(line, { types: 'chars' });
      gsap.set(split.chars, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: line,
        start: 'top 86%',
        once: true,
        onEnter: () => {
          gsap.to(split.chars, {
            yPercent: 0,
            duration: 1,
            stagger: 0.02,
            ease: 'expo.out',
          });
        },
      });
    });

    /* ── Contact footer ── */
    const contactFooter = document.querySelector('.contact__footer');
    if (contactFooter) {
      if (useNativeScroll) {
        gsap.set(contactFooter, { opacity: 1, y: 0 });
      } else {
        gsap.set(contactFooter, { opacity: 0, y: 20 });
        ScrollTrigger.create({
          trigger: contactFooter,
          start: 'top 90%',
          once: true,
          onEnter: () => gsap.to(contactFooter, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }),
        });
      }
    }

    const contactSect = document.getElementById('contact');

    /* ── Floating pill CTA (show/hide on scroll) ── */
    const floatCta      = document.getElementById('float-cta');
    if (floatCta) {
      ScrollTrigger.create({
        start:       '30vh top',
        end:         99999,
        onEnter:     () => floatCta.classList.add('is-visible'),
        onLeaveBack: () => floatCta.classList.remove('is-visible'),
      });
      if (contactSect) {
        ScrollTrigger.create({
          trigger:     contactSect,
          start:       'top bottom-=100',
          end:         'bottom top',
          onEnter:     () => floatCta.classList.remove('is-visible'),
          onLeave:     () => floatCta.classList.add('is-visible'),
          onEnterBack: () => floatCta.classList.remove('is-visible'),
          onLeaveBack: () => floatCta.classList.add('is-visible'),
        });
      }
    }

    /* ══════════════════════════════════════════════════
       THEME INVERSION — doit être créé EN DERNIER
       pour que les positions pinned soient calculées
    ══════════════════════════════════════════════════ */
    const DARK  = { bg: '#0A0A0A', fg: '#F0EDE6', theme: 'dark'  };
    const LIGHT = { bg: '#F0EDE6', fg: '#0A0A0A', theme: 'light' };

    const themeSections = [
      { id: '#hero',      colors: DARK  },
      { id: '#statement', colors: DARK  },
      { id: '#works',     colors: DARK  },
      { id: '#about',     colors: LIGHT },
      { id: '#services',  colors: DARK  },
      { id: '#contact',   colors: LIGHT },
      { id: '#footer',    colors: DARK  },
    ];

    function setTheme({ bg, fg, theme }) {
      if (shouldUseNativeScroll()) {
        gsap.set(document.body, { backgroundColor: bg, color: fg });
      } else {
        gsap.to(document.body, {
          backgroundColor: bg,
          color:           fg,
          duration:        1.1,
          ease:            'power2.inOut',
          overwrite:       true,
        });
      }
      document.body.setAttribute('data-theme', theme);
    }

    if (!shouldUseNativeScroll()) {
      themeSections.forEach(({ id, colors }) => {
        const el = document.querySelector(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger:     el,
          start:       'top 45%',
          end:         'bottom 45%',
          onEnter:     () => setTheme(colors),
          onEnterBack: () => setTheme(colors),
        });
      });
    } else {
      document.body.setAttribute('data-theme', 'dark');
      gsap.set(document.body, { backgroundColor: '#0A0A0A', color: '#F0EDE6' });
    }

    initServicesConsole();

    if (shouldUseNativeScroll() && window.visualViewport) {
      let vvTimer;
      const onViewportResize = () => {
        clearTimeout(vvTimer);
        vvTimer = setTimeout(() => ScrollTrigger.refresh(), 400);
      };
      window.visualViewport.addEventListener('resize', onViewportResize);
    }

    const homeContainer = document.querySelector('[data-barba-namespace="home"]');
    if (homeContainer) homeContainer.dataset.mfScrollReady = '1';

    ScrollTrigger.refresh();
    resetHomeScroll();
    document.body.setAttribute('data-theme', 'dark');
    gsap.set(document.body, { backgroundColor: '#0A0A0A', color: '#F0EDE6' });
    document.documentElement.classList.remove('is-preloading');
    requestAnimationFrame(() => {
      resetHomeScroll();
      ScrollTrigger.refresh();
    });
  }

  /* ── Home sans préloader (Barba ou retour rapide) ── */
  function initHomeFromBarba({ resumeOnly = false, scrollToTop = false } = {}) {
    const container =
      window.MF?.getActiveBarbaContainer?.('home') ||
      document.querySelector('[data-barba-namespace="home"]');
    if (!container) return;

    if (scrollToTop) {
      window.__mfHomeScroll = 0;
      resumeOnly = false;
    }

    restoreHomeEnvironment({ scrollToTop });

    gsap.set('#nav', { opacity: 1, y: 0, clearProps: 'transform' });

    document.querySelectorAll('.hero__line[data-split]').forEach((line) => {
      if (!line.querySelector('.char')) {
        const split = new SplitType(line, { types: 'chars' });
        gsap.set(split.chars, { y: 0, opacity: 1 });
      } else {
        gsap.set(line.querySelectorAll('.char'), { y: 0, opacity: 1 });
      }
    });

    document.querySelectorAll('.js-hero-name').forEach((el) => {
      if (!el.querySelector('.char')) {
        const s = new SplitType(el, { types: 'chars' });
        gsap.set(s.chars, { y: '0%', opacity: 1 });
      } else {
        gsap.set(el.querySelectorAll('.char'), { y: '0%', opacity: 1 });
      }
    });

    gsap.set('.hero__tag, .hero__footer, .hero__location, .hero__intro', {
      opacity: 1, x: 0, y: 0, clearProps: 'transform',
    });

    const heroNameImg = document.querySelector('.js-hero-name-imgs');
    if (heroNameImg) {
      gsap.set(heroNameImg, { opacity: 1, scale: 1 });
      heroNameImg.classList.add('is-revealed');
    }

    refitHeroLayout(false);

    if (resumeOnly && container.dataset.mfScrollReady === '1') {
      window.MF?.resumeHome?.();
      requestAnimationFrame(() => {
        ScrollTrigger.refresh(true);
        ScrollTrigger.update();
      });
      return;
    }

    initScrollWorld();
  }

  /* ══════════════════════════════════════════════════
     SERVICES CONSOLE
  ══════════════════════════════════════════════════ */
  function initServicesConsole() {
    const consoleEl = document.getElementById('services-console');
    if (!consoleEl) return;

    const navItems = consoleEl.querySelectorAll('.services-nav__item');
    const panels   = consoleEl.querySelectorAll('.services-panel');
    let activeIndex = 0;
    let animating   = false;

    function formatCount(el, value) {
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      el.textContent = `${prefix}${value}${suffix}`;
    }

    function runPanelCounts(panel) {
      panel.querySelectorAll('[data-count]').forEach((el) => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.1,
          ease: 'power2.out',
          onUpdate: () => formatCount(el, Math.round(obj.val)),
        });
      });
    }

    function scrollNavToActive(btn) {
      if (!btn || !useNativeScroll) return;
      btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }

    function switchPanel(index) {
      if (index === activeIndex || animating || !panels[index]) return;
      animating = true;

      const current = panels[activeIndex];
      const next    = panels[index];

      navItems.forEach((btn, i) => {
        btn.classList.toggle('is-active', i === index);
        btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      scrollNavToActive(navItems[index]);

      next.classList.add('is-switching');
      gsap.set(next, { opacity: 0, y: 18, visibility: 'visible', pointerEvents: 'auto', zIndex: 3 });

      gsap.timeline({
        onComplete: () => {
          current.classList.remove('is-active', 'is-switching');
          next.classList.add('is-active');
          next.classList.remove('is-switching');
          gsap.set(current, { clearProps: 'opacity,y,zIndex' });
          gsap.set(next, { clearProps: 'opacity,y,zIndex' });
          activeIndex = index;
          runPanelCounts(next);

          const items = next.querySelectorAll('.services-stat, .services-panel__list li');
          gsap.fromTo(items,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power3.out' }
          );
          animating = false;
          ScrollTrigger.refresh();
        },
      })
        .to(current, { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in' })
        .to(next, { opacity: 1, y: 0, duration: 0.36, ease: 'power3.out' }, '-=0.04');
    }

    navItems.forEach((btn, i) => {
      if (!useNativeScroll) {
        btn.addEventListener('mouseenter', () => switchPanel(i));
      }
      btn.addEventListener('focus', () => switchPanel(i));
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchPanel(i);
      });
    });

    runPanelCounts(panels[0]);

    gsap.set(consoleEl, { opacity: 0, y: 28 });
    if (useNativeScroll) {
      gsap.set(consoleEl, { opacity: 1, y: 0 });
      return;
    }
    ScrollTrigger.create({
      trigger: consoleEl,
      start: 'top 82%',
      once: true,
      onEnter: () => gsap.to(consoleEl, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }),
    });
  }

  /* ══════════════════════════════════════════════════
     WORK PREVIEW — Cursor follower
  ══════════════════════════════════════════════════ */
  const previewCursor      = document.getElementById('work-preview-cursor');
  const previewCursorInner = previewCursor ? previewCursor.querySelector('.work-preview-cursor__inner') : null;

  const previewGradients = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
    'linear-gradient(135deg, #1f0a2e 0%, #2d1b69 100%)',
    'linear-gradient(135deg, #0a1a0e 0%, #1a3a22 100%)',
  ];

  let prevX = 0, prevY = 0, prevRAF = null;
  let prevMoveX = 0, prevMoveY = 0;
  let prevVisible = false;

  if (previewCursor && previewCursorInner) {
    document.querySelectorAll('.work-item').forEach((item, i) => {
      item.addEventListener('mouseenter', () => {
        previewCursorInner.style.background = previewGradients[i % previewGradients.length];
        previewCursor.classList.add('is-visible');
        prevVisible = true;
        if (!prevRAF) prevRAF = requestAnimationFrame(tickPreview);
      });

      item.addEventListener('mouseleave', () => {
        previewCursor.classList.remove('is-visible');
        prevVisible = false;
      });

      item.addEventListener('mousemove', (e) => {
        prevMoveX = e.clientX;
        prevMoveY = e.clientY;
      });
    });

    function tickPreview() {
      prevX = lerp(prevX, prevMoveX, 0.08);
      prevY = lerp(prevY, prevMoveY, 0.08);
      gsap.set(previewCursor, { x: prevX, y: prevY });
      prevRAF = requestAnimationFrame(tickPreview);
    }
  }

  /* ══════════════════════════════════════════════════
     MAGNETIC ELEMENTS
  ══════════════════════════════════════════════════ */
  function magnetize(el, strength) {
    el.addEventListener('mousemove', (e) => {
      const r  = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * strength;
      const dy = (e.clientY - (r.top  + r.height / 2)) * strength;
      gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  }

  document.querySelectorAll('.cta-circle').forEach(el => magnetize(el, 0.35));
  document.querySelectorAll('.cta-badge').forEach(el => magnetize(el, 0.3));
  document.querySelectorAll('.float-cta__btn').forEach(el => magnetize(el, 0.2));
  document.querySelectorAll('.btn-outline').forEach(el => magnetize(el, 0.25));

  /* ══════════════════════════════════════════════════
     SMOOTH ANCHOR LINKS
  ══════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, {
          offset: -80,
          immediate: false,
        });
      }
    });
  });

  /* ══════════════════════════════════════════════════
     MARQUEE — direction liée au scroll
     bas = droite → gauche | haut = gauche → droite
  ══════════════════════════════════════════════════ */
  const marqueeTrack = document.querySelector('.marquee-track');

  if (marqueeTrack) {
    let marqueeX     = 0;
    let lastScroll   = lenis.scroll || 0;
    const marqueeSpd = 1.2;

    function getMarqueeLoop() {
      return marqueeTrack.scrollWidth / 2;
    }

    function wrapMarqueeX(x) {
      const loop = getMarqueeLoop();
      if (loop <= 0) return x;
      while (x <= -loop) x += loop;
      while (x > 0) x -= loop;
      return x;
    }

    let marqueePending = false;
    let marqueeDelta = 0;

    lenis.on('scroll', ({ scroll }) => {
      const delta = scroll - lastScroll;
      lastScroll = scroll;
      if (Math.abs(delta) < 0.01) return;

      marqueeDelta += delta;
      if (marqueePending) return;
      marqueePending = true;
      requestAnimationFrame(() => {
        marqueePending = false;
        const d = marqueeDelta;
        marqueeDelta = 0;
        marqueeX = wrapMarqueeX(marqueeX - d * marqueeSpd);
        gsap.set(marqueeTrack, { x: marqueeX, force3D: true });
      });
    });

    window.addEventListener('resize', () => {
      marqueeX = wrapMarqueeX(marqueeX);
      gsap.set(marqueeTrack, { x: marqueeX });
    });
  }

  window.MF?.initMotionStack?.();

  if (skipPreloader) {
    whenFontsReady().then(() => {
      refitHeroLayout(false);
      initHomeFromBarba();
    });
  }

  window.MF = window.MF || {};
  window.MF.initHomeFromBarba = initHomeFromBarba;
  window.MF.initScrollWorld = initScrollWorld;
  window.MF.restoreHomeEnvironment = restoreHomeEnvironment;
  window.MF.revealHomeAfterBarba = revealHomeAfterBarba;
  window.MF.scrollHomeToTop = function scrollHomeToTop() {
    window.__mfHomeScroll = 0;
    const l = window.__mfLenis;
    if (l) {
      l.scrollTo(0, { immediate: true });
      if (!useNativeScroll) l.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo(0, 0);
    }
  };
  window.MF.resetHomeScroll = resetHomeScroll;

  window.addEventListener('pageshow', (e) => {
    const navType = performance.getEntriesByType('navigation')[0]?.type;
    if (navType !== 'reload' && !e.persisted) return;
    if (!document.querySelector('[data-barba-namespace="home"]')) return;
    resetHomeScroll();
  });

  initGlobalFeatures(lenis);

}); /* ── end DOMContentLoaded (home) ── */


/* ══════════════════════════════════════════════════
   GLOBAL — Lenis helpers, contact modal, magnets
   (home + pages projet)
══════════════════════════════════════════════════ */
let __mfGlobalReady = false;

function isHomeHref(href) {
  if (!href) return false;
  let path = href.split('#')[0];
  while (path.startsWith('../')) path = path.slice(3);
  if (path.startsWith('./')) path = path.slice(2);
  return (
    path === '' ||
    path === '/' ||
    path === 'index.html' ||
    path.endsWith('/index.html') ||
    path.endsWith('/index')
  );
}

function isHomeTopLink(el) {
  if (!el?.getAttribute) return false;
  const href = el.getAttribute('href');
  if (!isHomeHref(href)) return false;
  return (
    el.classList.contains('nav__logo') ||
    el.classList.contains('footer__brand') ||
    el.classList.contains('project-cmd__logo') ||
    (el.classList.contains('nav__link') && !href.includes('#'))
  );
}

function initGlobalFeatures(lenis) {
  if (__mfGlobalReady) return;
  __mfGlobalReady = true;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !isHomeTopLink(link)) return;

    // Sur une page projet : laisser Barba (ou la navigation native) ramener à l’accueil
    if (
      document.body.classList.contains('page-project') ||
      document.documentElement.classList.contains('is-project-view')
    ) {
      return;
    }

    if (!document.body.classList.contains('page-home')) return;

    e.preventDefault();
    window.MF?.scrollHomeToTop?.();
  });

  /* ══════════════════════════════════════════════════
     CONTACT EMAIL HOVER SPLIT
  ══════════════════════════════════════════════════ */
  const contactEmailText = document.querySelector('.contact__email-text');
  if (contactEmailText) {
    const original = contactEmailText.textContent;
    contactEmailText.closest('.contact__email')?.addEventListener('mouseenter', () => {
      // subtle letter scramble
      let iteration = 0;
      const chars   = 'abcdefghijklmnopqrstuvwxyz0123456789@.';
      const orig    = original;
      const interval = setInterval(() => {
        contactEmailText.textContent = orig
          .split('')
          .map((char, i) => {
            if (i < iteration) return orig[i];
            if (char === ' ' || char === '@' || char === '.') return char;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
        if (iteration >= orig.length) clearInterval(interval);
        iteration += 1.5;
      }, 30);
    });
  }

  /* ══════════════════════════════════════════════════
     CONTACT MODAL
  ══════════════════════════════════════════════════ */
  const panel       = document.getElementById('contact-modal');
  const panelClose  = document.getElementById('contact-panel-close');

  const formEl      = document.getElementById('contact-form');
  const submitBtn   = document.getElementById('contact-submit');
  const successEl   = document.getElementById('contact-success');
  const errorEl     = document.getElementById('contact-error');
  const errorMsg    = document.getElementById('contact-error-msg');
  const successBack = document.getElementById('contact-success-back');

  if (panel) {
    panel.setAttribute('data-lenis-prevent', '');
  }

  function openPanel() {
    if (!panel) return;

    panel.setAttribute('aria-hidden', 'false');
    panel.style.pointerEvents = 'all';
    panel.scrollTop = 0;
    lenis.stop();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const header   = panel.querySelector('.contact-modal__header');
    const title    = panel.querySelector('.contact-modal__title');
    const info     = panel.querySelector('.contact-modal__info');
    const formRows = Array.from(panel.querySelectorAll(
      '.contact-form__row, .contact-form > .contact-form__field, .contact-form__submit-row'
    ));

    // Reset before animating
    gsap.set([header, title, info, ...formRows], { opacity: 0, y: 24 });

    const tl = gsap.timeline();

    tl.fromTo(panel,
        { opacity: 0 },
        { opacity: 1, duration: 0.45, ease: 'power2.out' }
      )
      .to(header,
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.2'
      )
      .to(title,
        { opacity: 1, y: 0, duration: 0.65, ease: 'expo.out' },
        '-=0.25'
      )
      .to(info,
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        '-=0.45'
      )
      .to(formRows,
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' },
        '-=0.4'
      );
  }

  function closePanel() {
    if (!panel) return;

    const header   = panel.querySelector('.contact-modal__header');
    const title    = panel.querySelector('.contact-modal__title');
    const info     = panel.querySelector('.contact-modal__info');
    const formRows = Array.from(panel.querySelectorAll(
      '.contact-form__row, .contact-form > .contact-form__field, .contact-form__submit-row'
    ));

    const tl = gsap.timeline({
      onComplete() {
        panel.setAttribute('aria-hidden', 'true');
        panel.style.pointerEvents = 'none';
        panel.scrollTop = 0;
        lenis.start();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    });

    tl.to([...formRows].reverse(),
        { opacity: 0, y: -16, duration: 0.22, stagger: 0.04, ease: 'power2.in' }
      )
      .to([info, title, header],
        { opacity: 0, y: -12, duration: 0.22, stagger: 0.04, ease: 'power2.in' },
        '-=0.1'
      )
      .to(panel,
        { opacity: 0, duration: 0.35, ease: 'power2.in' },
        '-=0.1'
      );
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-panel-trigger]');
    if (!trigger) return;
    e.preventDefault();
    openPanel();
  });
  panelClose?.addEventListener('click', closePanel);
  // Backdrop click closes the modal
  panel?.querySelector('.contact-modal__backdrop')?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel?.getAttribute('aria-hidden') === 'false') closePanel();
  });

  successBack?.addEventListener('click', () => {
    successEl.classList.remove('is-visible');
    if (formEl) {
      formEl.reset();
      formEl.style.opacity      = '1';
      formEl.style.pointerEvents = '';
    }
  });

  function getContactEndpoint() {
    if (typeof window.__MF_CONTACT_API__ === 'string' && window.__MF_CONTACT_API__) {
      return window.__MF_CONTACT_API__;
    }
    const { protocol, hostname, port } = window.location;
    const isFile = protocol === 'file:';
    const isLocal =
      isFile ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '';
    if (isLocal) return 'http://localhost:3001/send';
    /* Même origine (Railway, etc.) : pas de port externe */
    return '/api/send';
  }

  formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate required
    let valid = true;
    formEl.querySelectorAll('[required]').forEach(field => {
      field.classList.remove('is-error');
      if (!field.value.trim()) { field.classList.add('is-error'); valid = false; }
    });
    if (!valid) return;

    const emailField = formEl.querySelector('#f-email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.classList.add('is-error');
      return;
    }

    errorEl?.classList.remove('is-visible');
    submitBtn?.classList.add('is-loading');

    const data = {
      name:    formEl.querySelector('#f-name')?.value.trim(),
      email:   formEl.querySelector('#f-email')?.value.trim(),
      type:    formEl.querySelector('#f-type')?.value    || 'Non précisé',
      budget:  formEl.querySelector('#f-budget')?.value  || 'Non précisé',
      message: formEl.querySelector('#f-message')?.value.trim(),
    };

    try {
      const res = await fetch(getContactEndpoint(), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || 'Erreur serveur');
      }

      submitBtn?.classList.remove('is-loading');
      if (formEl) { formEl.style.opacity = '0'; formEl.style.pointerEvents = 'none'; }
      successEl?.classList.add('is-visible');

    } catch (err) {
      submitBtn?.classList.remove('is-loading');
      let msg = err.message || 'Une erreur est survenue.';
      if (err.name === 'TypeError' && /fetch|network/i.test(String(err.message))) {
        msg =
          'Serveur contact indisponible. En local : lancez « npm run dev » dans le dossier du projet.';
      }
      if (errorMsg) errorMsg.textContent = msg;
      errorEl?.classList.add('is-visible');
    }
  });

  formEl?.querySelectorAll('.contact-form__input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('is-error'));
  });

}

window.MF = window.MF || {};

window.MF.pauseHome = function pauseHome() {
  const lenis = window.__mfLenis;
  window.__mfHomeScroll = lenis?.scroll ?? window.scrollY ?? 0;
  lenis?.stop();
  ScrollTrigger.disable();
};

window.MF.resumeHome = function resumeHome() {
  const lenis = window.__mfLenis;
  ScrollTrigger.enable();
  lenis?.start();
  const y = window.__mfHomeScroll ?? 0;
  requestAnimationFrame(() => {
    lenis?.scrollTo(y, { immediate: true });
    ScrollTrigger.refresh(true);
    ScrollTrigger.update();
  });
};

window.MF.killScroll = function killScroll() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
};

window.MF.killProjectScroll = function killProjectScroll() {
  ScrollTrigger.getAll().forEach((st) => {
    let el = st.vars?.trigger ?? st.trigger;
    if (typeof el === 'string') el = document.querySelector(el);
    if (el?.closest?.('.project')) st.kill();
  });
};

window.MF.lenis = () => window.__mfLenis;
