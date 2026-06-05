/* Pages projet — dashboard Overwatch / Lobby */

(function () {
  let projectReady = false;
  let enterTl = null;
  let terminalIv = null;

  function getProjectRoot(container) {
    if (container?.classList?.contains('project-cmd')) return container;
    if (container?.querySelector) {
      const nested = container.querySelector('.project-cmd');
      if (nested) return nested;
    }
    const active = window.MF?.getActiveBarbaContainer?.('project');
    if (active) {
      const root = active.querySelector('.project-cmd');
      if (root) return root;
    }
    return document.querySelector('.project-cmd');
  }

  function formatMetric(el, value) {
    el.textContent = `${el.dataset.prefix || ''}${value}${el.dataset.suffix || ''}`;
  }

  function renderMetrics(container, items) {
    if (!container || !items?.length) return;
    container.innerHTML = items
      .map(
        (m) => `
        <li class="project-cmd__metric">
          <span class="project-cmd__metric-label">${m.label}</span>
          <span class="project-cmd__metric-val">
            <span data-count="${m.value}"${m.prefix ? ` data-prefix="${m.prefix}"` : ''}${m.suffix ? ` data-suffix="${m.suffix}"` : ''}>0</span>
          </span>
        </li>`
      )
      .join('');
  }

  function renderTally(container, items) {
    if (!container || !items?.length) return;
    container.innerHTML = items
      .map((m) => {
        const pct = Math.min(100, Math.max(0, m.value));
        return `
        <div class="project-cmd__tally-row">
          <span class="project-cmd__tally-label">${m.label.replace(/_/g, ' ')}</span>
          <div class="project-cmd__tally-bar">
            <span class="project-cmd__tally-fill" data-pct="${pct}"></span>
          </div>
          <span class="project-cmd__tally-val">
            <span data-count="${m.value}"${m.prefix ? ` data-prefix="${m.prefix}"` : ''}${m.suffix ? ` data-suffix="${m.suffix}"` : ''}>0</span>
          </span>
        </div>`;
      })
      .join('');
  }

  function populateContent(root, data) {
    root.querySelector('.js-cmd-title')?.textContent && (root.querySelector('.js-cmd-title').textContent = data.title);
    root.querySelectorAll('.js-cmd-year').forEach((el) => { el.textContent = data.year; });
    root.querySelector('.js-cmd-num')?.textContent && (root.querySelector('.js-cmd-num').textContent = data.num);
    root.querySelector('.js-cmd-type')?.textContent && (root.querySelector('.js-cmd-type').textContent = data.type);
    root.querySelector('.js-cmd-desc')?.textContent && (root.querySelector('.js-cmd-desc').textContent = data.description);
    root.querySelector('.js-cmd-role')?.textContent && (root.querySelector('.js-cmd-role').textContent = data.role);

    const websiteBtn = root.querySelector('.js-cmd-website');
    if (websiteBtn) {
      if (data.website) {
        websiteBtn.href = data.website;
        websiteBtn.hidden = false;
      } else {
        websiteBtn.hidden = true;
      }
    }

    renderMetrics(root.querySelector('.js-cmd-metrics-left'), data.metricsLeft);
    renderTally(root.querySelector('.js-cmd-tally'), data.metricsRight);

    const dirs = root.querySelector('.js-cmd-dirs');
    if (dirs) {
      dirs.innerHTML = data.deliverables
        .map((d, i) => {
          const slug = d.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '_');
          return `<li class="project-cmd__dir${i === 0 ? ' is-active' : ''}"><span>[ ${slug} ]</span><span class="project-cmd__dir-count">${String(i + 1).padStart(2, '0')}</span></li>`;
        })
        .join('');
    }

    const tasks = root.querySelector('.js-cmd-deliverables');
    if (tasks) {
      tasks.innerHTML = data.deliverables
        .map((d, i) => `<li class="project-cmd__task"><span class="project-cmd__task-idx">${String(i + 1).padStart(2, '0')}</span><span>${d}</span></li>`)
        .join('');
    }

    const stack = root.querySelector('.js-cmd-stack');
    if (stack) {
      stack.innerHTML = data.stack.map((s) => `<li class="project-cmd__stack-item">${s}</li>`).join('');
    }

    const terminal = root.querySelector('.js-cmd-terminal');
    if (terminal && data.terminal?.length) {
      const lines = [...data.terminal, ...data.terminal];
      terminal.innerHTML = lines.map((l) => `<span class="project-cmd__log">${l}</span>`).join('');
    }

    document.title = `${data.title} — Maxime Farineau`;
    document.body.style.setProperty('--project-accent', data.accent);
  }

  function fitVideoFrame(root) {
    const wrap = root.querySelector('.project-cmd__video-wrap');
    const frame = root.querySelector('.project-cmd__video-frame');
    const video = root.querySelector('.js-project-video');
    if (!wrap || !frame || !video?.videoWidth) return;

    const ratio = video.videoWidth / video.videoHeight;

    const apply = () => {
      const maxW = wrap.clientWidth;
      const maxH = wrap.clientHeight;
      if (!maxW || !maxH) return;

      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }

      frame.style.width = `${Math.round(w)}px`;
      frame.style.height = `${Math.round(h)}px`;

      const resEl = root.querySelector('.js-cmd-hud-res');
      const aspectEl = root.querySelector('.js-cmd-hud-aspect');
      if (resEl) resEl.textContent = `${video.videoWidth}×${video.videoHeight}`;
      if (aspectEl) {
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        const g = gcd(video.videoWidth, video.videoHeight) || 1;
        aspectEl.textContent = `${video.videoWidth / g}:${video.videoHeight / g}`;
      }
    };

    apply();

    root.__videoResizeObs?.disconnect();
    root.__videoResizeObs = new ResizeObserver(apply);
    root.__videoResizeObs.observe(wrap);
  }

  function resolveVideoSrc(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
    try {
      return new URL(src, window.location.href).href;
    } catch {
      return src;
    }
  }

  function resetVideo(root) {
    const video = root.querySelector('.js-project-video');
    if (!video) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    root.classList.remove('has-video');
    root.__videoResizeObs?.disconnect();
    root.__videoResizeObs = null;
  }

  function loadVideo(root) {
    const video = root.querySelector('.js-project-video');
    if (!video) return;
    const rawSrc = video.getAttribute('data-src');
    if (!rawSrc) return;

    resetVideo(root);

    const src = resolveVideoSrc(rawSrc);
    let retried = false;

    const onFail = () => {
      root.classList.remove('has-video');
      root.__videoResizeObs?.disconnect();
      root.__videoResizeObs = null;
    };

    let ready = false;
    const onReady = () => {
      if (ready) return;
      ready = true;
      root.classList.add('has-video');
      fitVideoFrame(root);
      video.play().catch(() => {});
    };

    video.addEventListener('loadedmetadata', onReady, { once: true });
    video.addEventListener('error', () => {
      if (!retried) {
        retried = true;
        ready = false;
        video.addEventListener('loadedmetadata', onReady, { once: true });
        video.addEventListener('error', onFail, { once: true });
        video.load();
        return;
      }
      onFail();
    }, { once: true });

    video.src = src;
    video.load();
  }

  function runCounts(root) {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => formatMetric(el, Math.round(obj.val)),
      });
    });

    root.querySelectorAll('.project-cmd__tally-fill').forEach((bar) => {
      const pct = bar.dataset.pct || 0;
      requestAnimationFrame(() => {
        bar.style.width = `${pct}%`;
      });
    });
  }

  function playEntrance(root) {
    if (enterTl) enterTl.kill();

    const left = root.querySelector('.project-cmd__panel--left');
    const right = root.querySelector('.project-cmd__panel--right');
    const viewport = root.querySelector('.project-cmd__viewport');
    const terminal = root.querySelector('.project-cmd__terminal');

    gsap.set([left, right], { opacity: 0, x: (i) => (i === 0 ? -40 : 40) });
    gsap.set(viewport, { opacity: 0, scale: 0.97 });
    gsap.set(terminal, { opacity: 0, y: 10 });

    enterTl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => runCounts(root),
    });

    enterTl
      .to(left, { opacity: 1, x: 0, duration: 0.9 }, 0.1)
      .to(viewport, { opacity: 1, scale: 1, duration: 1, ease: 'expo.inOut' }, 0.15)
      .to(right, { opacity: 1, x: 0, duration: 0.9 }, 0.2)
      .to(terminal, { opacity: 1, y: 0, duration: 0.5 }, 0.5);

    root.querySelectorAll('.project-cmd__metric, .project-cmd__task, .project-cmd__dir').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3 + i * 0.05, ease: 'power3.out' });
    });
  }

  function startTerminalScroll(root) {
    const track = root.querySelector('.js-cmd-terminal');
    if (!track) return;
    let x = 0;
    if (terminalIv) clearInterval(terminalIv);
    terminalIv = setInterval(() => {
      x -= 0.5;
      if (Math.abs(x) > track.scrollWidth / 2) x = 0;
      track.style.transform = `translateX(${x}px)`;
    }, 16);
  }

  function lockViewport() {
    document.documentElement.classList.add('is-project-view');
    window.__mfLenis?.stop();
    window.scrollTo(0, 0);
  }

  function cleanupProjectRoot(root) {
    if (!root) return;
    root.__videoResizeObs?.disconnect();
    root.__videoResizeObs = null;
    root.classList.remove('is-ready', 'has-video');
    resetVideo(root);
    gsap.killTweensOf(root.querySelectorAll('.project-cmd__panel, .project-cmd__viewport, .project-cmd__terminal, .project-cmd__metric, .project-cmd__task, .project-cmd__dir'));
  }

  function destroyProject(container) {
    projectReady = false;
    enterTl?.kill();
    enterTl = null;
    if (terminalIv) clearInterval(terminalIv);
    terminalIv = null;

    const root = getProjectRoot(container);
    if (root) cleanupProjectRoot(root);

    window.MF?.killProjectScroll?.();
    document.documentElement.classList.remove('is-project-view');
  }

  function initProjectPage(container) {
    const root = getProjectRoot(container);
    if (!root) return;

    const data = window.PROJECTS?.[root.dataset.project];
    if (!data) return;

    projectReady = true;
    lockViewport();
    root.classList.remove('is-ready');
    populateContent(root, data);
    loadVideo(root);

    requestAnimationFrame(() => {
      playEntrance(root);
      startTerminalScroll(root);
      root.classList.add('is-ready');
    });
  }

  window.MF = window.MF || {};
  window.MF.initProject = initProjectPage;
  window.MF.destroyProject = destroyProject;

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('[data-barba-namespace="project"]');
    if (container) initProjectPage(container);
  });

  window.addEventListener('mf:page-enter', (e) => {
    if (e.detail?.namespace === 'project') {
      projectReady = false;
      initProjectPage(e.detail.container);
    }
  });

  window.addEventListener('mf:page-leave', (e) => {
    destroyProject(e.detail?.container);
  });
})();
