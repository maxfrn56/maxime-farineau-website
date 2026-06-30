/* ══════════════════════════════════════════════════════
   MOTION STACK — GSAP micro-interactions (marquee + about)
   ══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let marqueeTweens = [];
  let aboutTriggers = [];

  function clearMotionStack() {
    marqueeTweens.forEach((t) => t.kill());
    marqueeTweens = [];
    aboutTriggers.forEach((st) => st.kill());
    aboutTriggers = [];
  }

  function isMobileMotion() {
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  }

  function initMarqueeLibs() {
    const libs = document.querySelectorAll('.marquee__lib');
    if (!libs.length || typeof gsap === 'undefined' || isMobileMotion()) return;

    libs.forEach((el, i) => {
      const pulse = gsap.to(el, {
        scale: 1.05,
        duration: 1.35 + i * 0.12,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: '50% 50%',
      });
      marqueeTweens.push(pulse);
    });
  }

  function initAboutMotionTags() {
    const tags = document.querySelectorAll('.about__tag--motion');
    const section = document.getElementById('about');
    if (!tags.length || !section || typeof gsap === 'undefined') return;

    const note = section.querySelector('.about__motion-note');

    if (isMobileMotion()) {
      tags.forEach((tag) => gsap.set(tag, { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }));
      if (note) gsap.set(note, { opacity: 1, y: 0 });
      return;
    }

    const hasST = typeof ScrollTrigger !== 'undefined';
    if (hasST) gsap.registerPlugin(ScrollTrigger);

    tags.forEach((tag) => {
      const delay = parseFloat(tag.dataset.delay || '0');

      if (hasST) {
        const st = ScrollTrigger.create({
          trigger: tag,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              tag,
              { y: 28, opacity: 0, scale: 0.82, rotate: -4 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                rotate: 0,
                duration: 0.85,
                delay,
                ease: 'back.out(1.6)',
              }
            );
          },
        });
        aboutTriggers.push(st);
      } else {
        gsap.set(tag, { opacity: 1 });
      }

      tag.addEventListener('mouseenter', () => {
        gsap.to(tag, {
          scale: 1.07,
          duration: 0.32,
          ease: 'power2.out',
        });
      });

      tag.addEventListener('mouseleave', () => {
        gsap.to(tag, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: 'elastic.out(1, 0.55)',
        });
      });

      tag.addEventListener('mousemove', (e) => {
        const r = tag.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.22;
        gsap.to(tag, { x, y, duration: 0.28, ease: 'power2.out' });
      });
    });

    if (note && hasST) {
      const stNote = ScrollTrigger.create({
        trigger: note,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          gsap.from(note, {
            y: 12,
            opacity: 0,
            duration: 0.6,
            delay: 0.25,
            ease: 'power2.out',
          });
        },
      });
      aboutTriggers.push(stNote);
    }
  }

  function initMotionStack() {
    clearMotionStack();
    initMarqueeLibs();
    initAboutMotionTags();
  }

  window.MF = window.MF || {};
  window.MF.initMotionStack = initMotionStack;
})();
