/* Miniatures hero — pages projet command center */
(function initHeroPreviews() {
  const mount = document.querySelector('.js-hero-name-imgs');
  const order = window.MF_PROJECT_ORDER || Object.keys(window.PROJECTS || {});
  if (!mount || !order.length || !window.PROJECTS) return;

  const VIDEO_SLUGS = new Set([
    'saline-ceviche',
    'cap-nage',
    'simply-leads',
    'jmmc-shop',
  ]);

  function metricDisplay(m) {
    if (!m) return '—';
    return `${m.prefix || ''}${m.value}${m.suffix || ''}`;
  }

  function videoSrc(slug) {
    if (!VIDEO_SLUGS.has(slug)) return '';
    return `assets/projects/${slug}.mp4`;
  }

  function buildCard(slug, idx) {
    const p = window.PROJECTS[slug];
    if (!p) return '';
    const src = videoSrc(slug);
    const mL = p.metricsLeft?.[0];
    const mR = p.metricsRight?.[0];
    const dir = p.deliverables?.[0] || p.type;
    const isActive = idx === 0;

    const stageMedia = src
      ? `<video class="hero-cmd-mini__video" muted loop playsinline preload="metadata" src="${src}" aria-hidden="true"></video>`
      : `<div class="hero-cmd-mini__placeholder" aria-hidden="true"></div>`;

    return `
      <div class="hero__name-card hero__name-card--preview${isActive ? ' is-active' : ''}" data-proj="${idx}" data-project="${slug}" style="--preview-accent:${p.accent}">
        <a href="projets/${slug}.html" class="hero__name-card-link js-project-link" data-project-transition="${slug}" aria-label="Voir le projet ${p.title}">
          <div class="hero-cmd-mini-wrap">
            <div class="hero-cmd-mini">
              <div class="hero-cmd-mini__shell">
                <header class="hero-cmd-mini__top">
                  <span class="hero-cmd-mini__brand">MF</span>
                  <span class="hero-cmd-mini__tabs"><em>Projects</em> · Contact</span>
                  <span class="hero-cmd-mini__meta-top">P:<em>${p.num}</em> · ${p.year}</span>
                  <span class="hero-cmd-mini__live"><i></i> LIVE</span>
                </header>
                <div class="hero-cmd-mini__body">
                  <aside class="hero-cmd-mini__panel hero-cmd-mini__panel--left">
                    <div class="hero-cmd-mini__panel-bar"><span>SYS_NAV</span><span class="is-ok">OK</span></div>
                    <div class="hero-cmd-mini__panel-body">
                      <span class="hero-cmd-mini__kicker">Active_Context</span>
                      <strong class="hero-cmd-mini__title">${p.title}</strong>
                      <span class="hero-cmd-mini__dir">${dir}</span>
                      <div class="hero-cmd-mini__session">
                        <div><span>Session</span><em>${p.num}</em></div>
                        <div><span>Year</span><em>${p.year}</em></div>
                      </div>
                    </div>
                  </aside>
                  <section class="hero-cmd-mini__viewport">
                    <div class="hero-cmd-mini__viewport-bar">
                      <span>// RECORD_QUEUE</span>
                      <span>${p.type}</span>
                    </div>
                    <div class="hero-cmd-mini__stage">
                      <div class="hero-cmd-mini__hud" aria-hidden="true">
                        <div class="hero-cmd-mini__grid"></div>
                        <div class="hero-cmd-mini__vignette"></div>
                        <span class="hero-cmd-mini__br hero-cmd-mini__br--tl"></span>
                        <span class="hero-cmd-mini__br hero-cmd-mini__br--tr"></span>
                        <span class="hero-cmd-mini__br hero-cmd-mini__br--bl"></span>
                        <span class="hero-cmd-mini__br hero-cmd-mini__br--br"></span>
                        <div class="hero-cmd-mini__rail hero-cmd-mini__rail--l">
                          <span class="hero-cmd-mini__tag">● REC</span>
                          <span>SHOWREEL</span>
                        </div>
                        <div class="hero-cmd-mini__rail hero-cmd-mini__rail--r">
                          <span class="hero-cmd-mini__tag">● LIVE</span>
                          <span>SYNC</span>
                        </div>
                        <div class="hero-cmd-mini__band hero-cmd-mini__band--t"><span>VIEWPORT</span><span>CH:01</span></div>
                        <div class="hero-cmd-mini__band hero-cmd-mini__band--b"><span>SYNC:OK</span><span>30 FPS</span></div>
                      </div>
                      ${stageMedia}
                      <div class="hero-cmd-mini__scanline" aria-hidden="true"></div>
                    </div>
                  </section>
                  <aside class="hero-cmd-mini__panel hero-cmd-mini__panel--right">
                    <div class="hero-cmd-mini__panel-bar"><span>INSPECTOR</span><span class="is-ok">SYNC</span></div>
                    <div class="hero-cmd-mini__panel-body">
                      <span class="hero-cmd-mini__kicker">Metrics</span>
                      <div class="hero-cmd-mini__metric">
                        <span>${mL?.label || 'STAT'}</span>
                        <em>${metricDisplay(mL)}</em>
                      </div>
                      <div class="hero-cmd-mini__metric">
                        <span>${mR?.label || 'STAT'}</span>
                        <em>${metricDisplay(mR)}</em>
                      </div>
                      <div class="hero-cmd-mini__stack">
                        ${(p.stack || []).slice(0, 2).map((s) => `<span>${s}</span>`).join('')}
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
          <span class="hero__name-card-cta">Voir le projet</span>
        </a>
      </div>`;
  }

  mount.innerHTML = order.map(buildCard).join('');

  function syncPreviewVideos() {
    mount.querySelectorAll('.hero-cmd-mini__video').forEach((v) => {
      v.pause();
    });
    const active = mount.querySelector('.hero__name-card.is-active .hero-cmd-mini__video');
    if (active) active.play().catch(() => {});
  }

  document.addEventListener('hero-card-change', syncPreviewVideos);

  const hero = document.getElementById('hero');
  mount.addEventListener('pointerenter', () => syncPreviewVideos());
  mount.addEventListener('pointerleave', () => {
    mount.querySelectorAll('.hero-cmd-mini__video').forEach((v) => v.pause());
  });

  if (hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) {
            mount.querySelectorAll('.hero-cmd-mini__video').forEach((v) => v.pause());
          } else {
            syncPreviewVideos();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(mount);
  }

  syncPreviewVideos();
})();
