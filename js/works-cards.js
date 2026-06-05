/* Works — cartes preview style pages projet (command center) */
function buildWorksCards(mountEl) {
  const mount = mountEl || document.getElementById('roulette-preview');
  const order = window.MF_PROJECT_ORDER || Object.keys(window.PROJECTS || {});
  if (!mount || !order.length || !window.PROJECTS) return;

  const LOGOS = {
    'saline-ceviche': { src: 'assets/hero/saline-logo.png', max: '52%' },
    'cap-nage': { src: 'assets/hero/cap-nage-logo.png', max: '48%' },
    'simply-leads': { src: 'assets/hero/simply-leads-logo.png', max: '58%' },
    'jmmc-shop': { src: 'assets/hero/jmmc-logo.png', max: '62%' },
    'laetitia-nutrition': { src: 'assets/hero/laetitia-logo.png', max: '72%' },
  };

  function metricDisplay(m) {
    if (!m) return '—';
    return `${m.prefix || ''}${m.value}${m.suffix || ''}`;
  }

  function buildCard(slug, idx) {
    const p = window.PROJECTS[slug];
    if (!p) return '';
    const logo = LOGOS[slug];
    const mL = p.metricsLeft?.[0];
    const mR = p.metricsRight?.[0];
    const mR2 = p.metricsRight?.[1];
    const dir = p.deliverables?.[0] || p.type;
    const stack = (p.stack || []).slice(0, 2);

    const logoBlock = logo
      ? `<div class="works-cmd__logo-wrap" style="--logo-max:${logo.max}">
           <img class="works-cmd__logo" src="${logo.src}" alt="" width="200" height="200" loading="lazy" />
         </div>`
      : `<div class="works-cmd__logo-placeholder" aria-hidden="true"></div>`;

    return `
      <div class="roulette__card works-cmd-card" data-idx="${idx}" data-project="${slug}" style="--works-accent:${p.accent}">
        <a href="projets/${slug}.html" class="works-cmd-card__hit js-project-link" data-project-transition="${slug}" aria-label="Voir le projet ${p.title}">
          <div class="works-cmd">
            <div class="works-cmd__shell">
              <header class="works-cmd__top">
                <span class="works-cmd__brand">MF</span>
                <span class="works-cmd__tabs"><em>Projects</em> · Works</span>
                <span class="works-cmd__meta-top">P:<em>${p.num}</em> · ${p.year}</span>
                <span class="works-cmd__live"><i></i> LIVE</span>
              </header>
              <div class="works-cmd__body">
                <aside class="works-cmd__panel works-cmd__panel--left">
                  <div class="works-cmd__panel-bar"><span>SYS_NAV</span><span class="is-ok">OK</span></div>
                  <div class="works-cmd__panel-body">
                    <span class="works-cmd__kicker">Active_Context</span>
                    <strong class="works-cmd__title">${p.title}</strong>
                    <span class="works-cmd__dir">${dir}</span>
                    <div class="works-cmd__metric">
                      <span>${mL?.label || 'STAT'}</span>
                      <em>${metricDisplay(mL)}</em>
                    </div>
                    <div class="works-cmd__session">
                      <div><span>Session</span><em>${p.num}</em></div>
                      <div><span>Year</span><em>${p.year}</em></div>
                    </div>
                  </div>
                </aside>
                <section class="works-cmd__viewport">
                  <div class="works-cmd__viewport-bar">
                    <span>// RECORD_QUEUE</span>
                    <span>${p.type}</span>
                  </div>
                  <div class="works-cmd__stage">
                    <div class="works-cmd__hud" aria-hidden="true">
                      <div class="works-cmd__grid"></div>
                      <div class="works-cmd__vignette"></div>
                      <span class="works-cmd__br works-cmd__br--tl"></span>
                      <span class="works-cmd__br works-cmd__br--tr"></span>
                      <span class="works-cmd__br works-cmd__br--bl"></span>
                      <span class="works-cmd__br works-cmd__br--br"></span>
                      <div class="works-cmd__rail works-cmd__rail--l">
                        <span class="works-cmd__tag">● REC</span>
                        <span>SHOWREEL</span>
                      </div>
                      <div class="works-cmd__rail works-cmd__rail--r">
                        <span class="works-cmd__tag">● LIVE</span>
                        <span>SYNC</span>
                      </div>
                      <div class="works-cmd__band works-cmd__band--t"><span>VIEWPORT</span><span>CH:01</span></div>
                      <div class="works-cmd__band works-cmd__band--b"><span>SYNC:OK</span><span>30 FPS</span></div>
                    </div>
                    ${logoBlock}
                    <div class="works-cmd__scanline" aria-hidden="true"></div>
                    <span class="works-cmd__corner works-cmd__corner--tl"></span>
                    <span class="works-cmd__corner works-cmd__corner--tr"></span>
                    <span class="works-cmd__corner works-cmd__corner--bl"></span>
                    <span class="works-cmd__corner works-cmd__corner--br"></span>
                  </div>
                </section>
                <aside class="works-cmd__panel works-cmd__panel--right">
                  <div class="works-cmd__panel-bar"><span>INSPECTOR</span><span class="is-ok">SYNC</span></div>
                  <div class="works-cmd__panel-body">
                    <span class="works-cmd__kicker">Metrics</span>
                    <div class="works-cmd__metric">
                      <span>${mR?.label || 'STAT'}</span>
                      <em>${metricDisplay(mR)}</em>
                    </div>
                    <div class="works-cmd__metric">
                      <span>${mR2?.label || 'STAT'}</span>
                      <em>${metricDisplay(mR2)}</em>
                    </div>
                    <div class="works-cmd__stack">
                      ${stack.map((s) => `<span>${s}</span>`).join('')}
                    </div>
                  </div>
                </aside>
              </div>
              <footer class="works-cmd__footer">
                <span>// open_showreel</span>
                <span class="works-cmd__cta">Voir le projet <em>↗</em></span>
              </footer>
            </div>
          </div>
        </a>
      </div>`;
  }

  mount.innerHTML = order.map(buildCard).join('');
}

buildWorksCards();

window.MF = window.MF || {};
window.MF.rebuildWorksCards = buildWorksCards;
