/* Works — cartes preview (style project-cmd) */
const WORKS_LOGOS = {
  'saline-ceviche': { src: 'assets/hero/saline-logo.png', max: '56%' },
  'cap-nage': { src: 'assets/hero/cap-nage-logo.png', max: '52%' },
  'simply-leads': { src: 'assets/hero/simply-leads-logo.png', max: '60%' },
  'jmmc-shop': { src: 'assets/hero/jmmc-logo.png', max: '64%' },
  'laetitia-nutrition': { src: 'assets/hero/laetitia-logo.png', max: '72%' },
  'time-saving': { src: 'assets/hero/time-saving-logo.png', max: '58%' },
};

const bounceStates = new WeakMap();
let bounceRafId = 0;

function buildWorksCards(mountEl) {
  const mount = mountEl || document.getElementById('roulette-preview');
  const order = window.MF_PROJECT_ORDER || Object.keys(window.PROJECTS || {});
  if (!mount || !order.length || !window.PROJECTS) return;

  function buildCard(slug, idx) {
    const p = window.PROJECTS[slug];
    if (!p) return '';
    const stack = (p.stack || []).slice(0, 3);
    const deliverableCount = (p.deliverables || []).length;
    const logo = WORKS_LOGOS[slug];

    const logoBlock = logo
      ? logo.preview
        ? `<div class="works-card__arena works-card__arena--preview" data-bounce-arena>
            <img class="works-card__preview" src="${logo.src}" alt="" width="640" height="360" loading="lazy" />
          </div>`
        : `<div class="works-card__arena" data-bounce-arena>
            <img class="works-card__logo" src="${logo.src}" alt="" width="200" height="200" loading="lazy" style="--logo-max:${logo.max}" />
          </div>`
      : `<div class="works-card__arena" data-bounce-arena>
          <span class="works-card__logo-fallback" aria-hidden="true">${p.title.charAt(0)}</span>
        </div>`;

    return `
      <div class="roulette__card works-card" data-idx="${idx}" data-project="${slug}">
        <a href="projets/${slug}.html" class="works-card__link js-project-link" data-project-transition="${slug}" aria-label="Voir le projet ${p.title}">
          <header class="works-card__top">
            <span class="works-card__mark">MF</span>
            <div class="works-card__meta">
              <span>PROJECT:<em>${p.num}</em></span>
              <span>YEAR:<em>${p.year}</em></span>
              <span class="works-card__live"><span class="works-card__live-dot" aria-hidden="true"></span>LIVE</span>
            </div>
          </header>

          <section class="works-card__viewport">
            <div class="works-card__viewport-bar">
              <span>// SHOWREEL</span>
              <span class="works-card__type">${p.type}</span>
            </div>
            <div class="works-card__screen">
              ${logoBlock}
              <div class="works-card__hud" aria-hidden="true">
                <span class="works-card__bracket works-card__bracket--tl"></span>
                <span class="works-card__bracket works-card__bracket--tr"></span>
                <span class="works-card__bracket works-card__bracket--bl"></span>
                <span class="works-card__bracket works-card__bracket--br"></span>
                <span class="works-card__grid"></span>
              </div>
            </div>
          </section>

          <footer class="works-card__panel">
            <div class="works-card__panel-bar">
              <span>ACTIVE_CTX</span>
              <span class="works-card__ok">LINK:OK</span>
            </div>
            <div class="works-card__panel-body">
              <span class="works-card__ctx-label">Project</span>
              <h3 class="works-card__title">${p.title}</h3>
              <ul class="works-card__dirs">
                ${stack.map((s, i) => `
                  <li class="works-card__dir${i === 0 ? ' is-active' : ''}">
                    <span>[ ${s.toLowerCase()} ]</span>
                  </li>`).join('')}
                <li class="works-card__dir">
                  <span>[ deliverables ]</span>
                  <span class="works-card__dir-count">${deliverableCount}</span>
                </li>
              </ul>
              <span class="works-card__open">Ouvrir le dossier <em aria-hidden="true">→</em></span>
            </div>
          </footer>
        </a>
      </div>`;
  }

  mount.innerHTML = order.map(buildCard).join('');
}

function seedBounceState(arena, item) {
  const w = arena.clientWidth;
  const h = arena.clientHeight;
  const lw = item.offsetWidth;
  const lh = item.offsetHeight;
  const maxX = Math.max(0, w - lw);
  const maxY = Math.max(0, h - lh);
  const speed = 0.22 + Math.random() * 0.18;

  bounceStates.set(arena, {
    x: Math.random() * maxX,
    y: Math.random() * maxY,
    vx: (Math.random() > 0.5 ? 1 : -1) * speed,
    vy: (Math.random() > 0.5 ? 1 : -1) * speed,
  });

  item.style.transform = `translate3d(${bounceStates.get(arena).x}px, ${bounceStates.get(arena).y}px, 0)`;
}

function setupBounceArena(arena) {
  const item = arena.querySelector('.works-card__logo, .works-card__logo-fallback');
  if (!item) return;

  const init = () => seedBounceState(arena, item);

  if (item.tagName === 'IMG' && !item.complete) {
    item.addEventListener('load', init, { once: true });
  } else {
    requestAnimationFrame(init);
  }
}

function tickBounce() {
  const mount = document.getElementById('roulette-preview');
  const activeCard = mount?.querySelector('.works-card.is-active');
  const arena = activeCard?.querySelector('[data-bounce-arena]');
  const item = arena?.querySelector('.works-card__logo, .works-card__logo-fallback');
  const state = arena && bounceStates.get(arena);

  if (arena && item && state) {
    const maxX = Math.max(0, arena.clientWidth - item.offsetWidth);
    const maxY = Math.max(0, arena.clientHeight - item.offsetHeight);

    state.x += state.vx;
    state.y += state.vy;

    if (state.x <= 0) {
      state.x = 0;
      state.vx = Math.abs(state.vx);
    } else if (state.x >= maxX) {
      state.x = maxX;
      state.vx = -Math.abs(state.vx);
    }

    if (state.y <= 0) {
      state.y = 0;
      state.vy = Math.abs(state.vy);
    } else if (state.y >= maxY) {
      state.y = maxY;
      state.vy = -Math.abs(state.vy);
    }

    item.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
  }

  bounceRafId = requestAnimationFrame(tickBounce);
}

function initWorksCardBounce(mountEl) {
  const mount = mountEl || document.getElementById('roulette-preview');
  if (!mount) return;

  if (window.matchMedia('(max-width: 768px), (pointer: coarse)').matches) return;

  window.MF?._worksBounceObs?.disconnect();
  window.MF?._worksBounceResizeObs?.disconnect();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  mount.querySelectorAll('[data-bounce-arena]').forEach((arena) => {
    if (arena.classList.contains('works-card__arena--preview')) return;
    setupBounceArena(arena);
  });

  mount.querySelectorAll('.works-card__arena--preview').forEach((arena) => {
    bounceStates.delete(arena);
  });

  if (reducedMotion) return;

  if (!bounceRafId) {
    bounceRafId = requestAnimationFrame(tickBounce);
  }

  const observer = new MutationObserver(() => {
    const activeCard = mount.querySelector('.works-card.is-active');
    const arena = activeCard?.querySelector('[data-bounce-arena]');
    if (arena && !bounceStates.has(arena)) {
      setupBounceArena(arena);
    }
  });

  observer.observe(mount, { subtree: true, attributes: true, attributeFilter: ['class'] });
  window.MF = window.MF || {};
  window.MF._worksBounceObs = observer;

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObs = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const arena = entry.target;
        const item = arena.querySelector('.works-card__logo, .works-card__logo-fallback');
        if (item) seedBounceState(arena, item);
      });
    });

    mount.querySelectorAll('[data-bounce-arena]').forEach((arena) => resizeObs.observe(arena));
    window.MF._worksBounceResizeObs = resizeObs;
  }
}

function rebuildWorksCards(mountEl) {
  if (bounceRafId) {
    cancelAnimationFrame(bounceRafId);
    bounceRafId = 0;
  }

  window.MF?._worksBounceObs?.disconnect();
  window.MF?._worksBounceResizeObs?.disconnect();

  buildWorksCards(mountEl);
  initWorksCardBounce(mountEl);
}

buildWorksCards();
initWorksCardBounce();

window.MF = window.MF || {};
window.MF.rebuildWorksCards = rebuildWorksCards;
