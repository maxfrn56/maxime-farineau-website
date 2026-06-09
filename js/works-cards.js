/* Works — cartes preview (style project-cmd) */
function buildWorksCards(mountEl) {
  const mount = mountEl || document.getElementById('roulette-preview');
  const order = window.MF_PROJECT_ORDER || Object.keys(window.PROJECTS || {});
  if (!mount || !order.length || !window.PROJECTS) return;

  function posterSrc(p) {
    if (!p.poster) return '';
    return p.poster.replace(/^\.\.\//, '');
  }

  function buildCard(slug, idx) {
    const p = window.PROJECTS[slug];
    if (!p) return '';
    const stack = (p.stack || []).slice(0, 3);
    const poster = posterSrc(p);
    const deliverableCount = (p.deliverables || []).length;

    const screenBlock = poster
      ? `<img class="works-card__shot" src="${poster}" alt="" loading="lazy" />`
      : `<span class="works-card__shot-fallback" aria-hidden="true">${p.title.charAt(0)}</span>`;

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
              ${screenBlock}
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

buildWorksCards();

window.MF = window.MF || {};
window.MF.rebuildWorksCards = buildWorksCards;
