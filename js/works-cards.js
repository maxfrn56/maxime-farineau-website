/* Works — cartes preview épurées */
function buildWorksCards(mountEl) {
  const mount = mountEl || document.getElementById('roulette-preview');
  const order = window.MF_PROJECT_ORDER || Object.keys(window.PROJECTS || {});
  if (!mount || !order.length || !window.PROJECTS) return;

  const LOGOS = {
    'saline-ceviche': { src: 'assets/hero/saline-logo.png', max: '56%' },
    'cap-nage': { src: 'assets/hero/cap-nage-logo.png', max: '52%' },
    'simply-leads': { src: 'assets/hero/simply-leads-logo.png', max: '60%' },
    'jmmc-shop': { src: 'assets/hero/jmmc-logo.png', max: '64%' },
    'laetitia-nutrition': { src: 'assets/hero/laetitia-logo.png', max: '72%' },
  };

  function posterSrc(p) {
    if (!p.poster) return '';
    return p.poster.replace(/^\.\.\//, '');
  }

  function buildCard(slug, idx) {
    const p = window.PROJECTS[slug];
    if (!p) return '';
    const logo = LOGOS[slug];
    const stack = (p.stack || []).slice(0, 2);
    const poster = posterSrc(p);

    const logoBlock = logo
      ? `<img class="works-card__logo" src="${logo.src}" alt="" width="200" height="200" loading="lazy" style="--logo-max:${logo.max}" />`
      : `<span class="works-card__logo-fallback" aria-hidden="true">${p.title.charAt(0)}</span>`;

    const posterBlock = poster
      ? `<img class="works-card__poster" src="${poster}" alt="" loading="lazy" />`
      : '';

    return `
      <div class="roulette__card works-card" data-idx="${idx}" data-project="${slug}" style="--works-accent:${p.accent}">
        <a href="projets/${slug}.html" class="works-card__link js-project-link" data-project-transition="${slug}" aria-label="Voir le projet ${p.title}">
          <div class="works-card__visual">
            ${posterBlock}
            <div class="works-card__visual-glow" aria-hidden="true"></div>
            <div class="works-card__visual-inner">
              ${logoBlock}
            </div>
          </div>
          <div class="works-card__body">
            <div class="works-card__meta">
              <span class="works-card__num">${p.num}</span>
              <span class="works-card__sep" aria-hidden="true">·</span>
              <span class="works-card__year">${p.year}</span>
            </div>
            <h3 class="works-card__title">${p.title}</h3>
            <p class="works-card__type">${p.type}</p>
            <div class="works-card__foot">
              <div class="works-card__tags">
                ${stack.map((s) => `<span>${s}</span>`).join('')}
              </div>
              <span class="works-card__cta">Voir <em aria-hidden="true">↗</em></span>
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
