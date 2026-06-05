import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const dataSrc = readFileSync(join(root, 'js/projects-data.js'), 'utf8');
const contactModal = readFileSync(join(root, 'partials/contact-modal.html'), 'utf8');
const faviconProject = readFileSync(join(root, 'partials/favicon-project.html'), 'utf8');
const orderMatch = dataSrc.match(/window\.MF_PROJECT_ORDER = (\[[\s\S]*?\]);/);
const order = orderMatch ? eval(orderMatch[1]) : [];

const SITE_URL = 'https://maximefarineau.com';
const OG_IMAGE = `${SITE_URL}/assets/og-cover.jpg`;

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function seoHead({ pageTitle, description, canonicalPath, ogType = 'article' }) {
  const url = `${SITE_URL}${canonicalPath}`;
  const desc = escapeHtml(description);
  const title = escapeHtml(pageTitle);
  return `  <meta name="description" content="${desc}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="author" content="Maxime Farineau" />
  <link rel="canonical" href="${url}" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Maxime Farineau" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:alt" content="${title}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <title>${title}</title>`;
}

function projectJsonLd(slug, p) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.description,
    url: `${SITE_URL}/projets/${slug}.html`,
    inLanguage: 'fr-FR',
    dateCreated: p.year,
    creator: {
      '@type': 'Person',
      name: 'Maxime Farineau',
      url: `${SITE_URL}/`,
    },
    keywords: p.type,
  };
  return `  <script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function extractProject(slug) {
  const re = new RegExp(`'${slug}':\\s*\\{([\\s\\S]*?)\\n  \\},`);
  const m = dataSrc.match(re);
  if (!m) return null;
  const block = `{${m[1]}\n}`;
  const g = (key) => {
    const m1 = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
    if (m1) return m1[1];
    const m2 = block.match(new RegExp(`${key}:\\s*"([^"]*)"`));
    return m2 ? m2[1] : undefined;
  };
  const descM = block.match(/description:\s*\n\s*'([^']+)'/);
  return {
    title: g('title'),
    num: g('num'),
    year: g('year'),
    type: g('type'),
    accent: g('accent'),
    prev: g('prev'),
    next: g('next'),
    description: descM ? descM[1] : `${g('title')} — projet web par Maxime Farineau`,
  };
}

function page(slug, p) {
  const prevP = extractProject(p.prev);
  const nextP = extractProject(p.next);
  const session = p.num?.padStart(2, '0') || '01';
  const pageTitle = `${p.title} — Projet Web | Maxime Farineau`;
  const metaDesc = `${p.description} (${p.type}) — Réalisé par Maxime Farineau, développeur web freelance.`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${seoHead({ pageTitle, description: metaDesc, canonicalPath: `/projets/${slug}.html` })}
${faviconProject}${projectJsonLd(slug, p)}
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/project.css" />
</head>
<body class="page-project" data-theme="dark" data-barba="wrapper" style="--project-accent: ${p.accent}">

  <div class="grain" aria-hidden="true"></div>

  <div id="barba-transition" class="barba-transition" aria-hidden="true">
    <div class="barba-transition__bg"></div>
    <span class="barba-transition__meta tag-code"></span>
    <h2 class="barba-transition__title"></h2>
    <div class="barba-transition__progress"><span></span></div>
  </div>

  <main data-barba="container" data-barba-namespace="project">
    <article class="project project-cmd" data-project="${slug}">

      <div class="project-cmd__shell">

        <header class="project-cmd__top">
          <div class="project-cmd__brand">
            <a href="/" class="project-cmd__logo">MAXIME FARINEAU</a>
            <nav class="project-cmd__tabs" aria-label="Navigation projet">
              <a href="/#works" class="project-cmd__tab is-active">Projects</a>
              <button type="button" class="project-cmd__tab" data-panel-trigger>Contact</button>
            </nav>
          </div>
          <div class="project-cmd__meta">
            <span>PROJECT:<em class="js-cmd-num">${p.num}</em></span>
            <span>SESSION:<em>${session}</em></span>
            <span>YEAR:<em class="js-cmd-year">${p.year}</em></span>
            <span class="project-cmd__live"><span class="project-cmd__live-dot"></span> SHOWREEL_ACTIVE</span>
          </div>
        </header>

        <div class="project-cmd__body">

          <aside class="project-cmd__panel project-cmd__panel--left">
            <div class="project-cmd__panel-bar">
              <span>SYS_NAV</span>
              <span class="project-cmd__ok">LINK:OK</span>
            </div>
            <div class="project-cmd__panel-scroll">
              <a href="/#works" class="project-cmd__back">← Retour aux projets</a>

              <div class="project-cmd__context">
                <span class="project-cmd__context-label">Active_Context</span>
                <h1 class="project-cmd__context-title js-cmd-title">${p.title}</h1>
                <div class="project-cmd__context-grid">
                  <div class="project-cmd__context-item">
                    <span>Session</span>
                    <em>${session}</em>
                  </div>
                  <div class="project-cmd__context-item">
                    <span>Year</span>
                    <em class="js-cmd-year">${p.year}</em>
                  </div>
                </div>
              </div>

              <div class="project-cmd__block">
                <span class="project-cmd__label">Directories</span>
                <ul class="project-cmd__dirs js-cmd-dirs"></ul>
              </div>

              <div class="project-cmd__block">
                <span class="project-cmd__label">[ METRICS ]</span>
                <ul class="project-cmd__metrics js-cmd-metrics-left"></ul>
              </div>
            </div>
          </aside>

          <section class="project-cmd__viewport">
            <div class="project-cmd__viewport-bar">
              <span>// RECORD_QUEUE · SHOWREEL</span>
              <span class="js-cmd-type">${p.type}</span>
            </div>
            <div class="project-cmd__video-wrap">
              <div class="project-cmd__viewport-hud" aria-hidden="true">
                <div class="project-cmd__viewport-grid"></div>
                <div class="project-cmd__viewport-vignette"></div>
                <span class="project-cmd__viewport-bracket project-cmd__viewport-bracket--tl"></span>
                <span class="project-cmd__viewport-bracket project-cmd__viewport-bracket--tr"></span>
                <span class="project-cmd__viewport-bracket project-cmd__viewport-bracket--bl"></span>
                <span class="project-cmd__viewport-bracket project-cmd__viewport-bracket--br"></span>
                <div class="project-cmd__viewport-rail project-cmd__viewport-rail--left">
                  <span class="project-cmd__viewport-tag project-cmd__viewport-tag--rec">● REC</span>
                  <span>SHOWREEL</span>
                  <span class="project-cmd__viewport-tag">FEED_01</span>
                  <span class="js-cmd-hud-res">—</span>
                </div>
                <div class="project-cmd__viewport-rail project-cmd__viewport-rail--right">
                  <span class="project-cmd__viewport-tag project-cmd__viewport-tag--live">● LIVE</span>
                  <span>LOOP</span>
                  <span class="js-cmd-hud-aspect">—</span>
                  <span>SYNC:OK</span>
                </div>
                <div class="project-cmd__viewport-band project-cmd__viewport-band--top">
                  <span>// VIEWPORT · RECORD_QUEUE</span>
                  <span>CH: SHOWREEL</span>
                </div>
                <div class="project-cmd__viewport-band project-cmd__viewport-band--bottom">
                  <span>FRAME_SYNC: OK</span>
                  <span>BITRATE: AUTO</span>
                  <span class="js-cmd-hud-fps">30 FPS</span>
                </div>
              </div>
              <div class="project-cmd__video-frame">
                <video
                  class="project-cmd__video js-project-video"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  data-src="../assets/projects/${slug}.mp4"
                  poster="../assets/projects/${slug}.jpg"
                ></video>
                <div class="project-cmd__video-fallback" aria-hidden="true">
                  <span>// video.showreel — à brancher</span>
                </div>
                <div class="project-cmd__scanline" aria-hidden="true"></div>
                <span class="project-cmd__frame-corner project-cmd__frame-corner--tl"></span>
                <span class="project-cmd__frame-corner project-cmd__frame-corner--tr"></span>
                <span class="project-cmd__frame-corner project-cmd__frame-corner--bl"></span>
                <span class="project-cmd__frame-corner project-cmd__frame-corner--br"></span>
              </div>
            </div>
          </section>

          <aside class="project-cmd__panel project-cmd__panel--right">
            <div class="project-cmd__panel-bar">
              <span>INSPECTOR</span>
              <span class="project-cmd__ok">SYNC:OK</span>
            </div>
            <div class="project-cmd__panel-scroll project-cmd__panel-scroll--inspector">
              <div class="project-cmd__block">
                <span class="project-cmd__label">Active_Context</span>
                <p class="project-cmd__desc js-cmd-desc"></p>
              </div>
              <div class="project-cmd__block">
                <span class="project-cmd__label">Final_Tally_Analysis</span>
                <div class="project-cmd__tally js-cmd-tally"></div>
              </div>
              <div class="project-cmd__block">
                <span class="project-cmd__label">[ DELIVERABLES ]</span>
                <ul class="project-cmd__tasks js-cmd-deliverables"></ul>
              </div>
              <div class="project-cmd__block">
                <span class="project-cmd__label">[ STACK ]</span>
                <ul class="project-cmd__stack js-cmd-stack"></ul>
              </div>
              <div class="project-cmd__block">
                <span class="project-cmd__label">ROLE</span>
                <p class="project-cmd__role js-cmd-role"></p>
              </div>
              <div class="project-cmd__website-zone">
                <a
                  class="project-cmd__website js-cmd-website"
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  hidden
                >GO TO WEBSITE ↗</a>
              </div>
            </div>
            <nav class="project-cmd__nav" aria-label="Navigation projets">
              <a href="${p.prev}.html" class="project-cmd__nav-btn js-project-link" data-project-transition="${p.prev}">← ${prevP?.title || 'PREV'}</a>
              <button type="button" class="project-cmd__nav-btn" data-panel-trigger>CONTACT ↗</button>
              <a href="${p.next}.html" class="project-cmd__nav-btn js-project-link" data-project-transition="${p.next}">${nextP?.title || 'NEXT'} →</a>
            </nav>
          </aside>

        </div>

        <footer class="project-cmd__terminal">
          <div class="project-cmd__terminal-inner js-cmd-terminal"></div>
        </footer>

      </div>
    </article>
  </main>

  ${contactModal}

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@barba/core@2.9.7/dist/barba.umd.js"></script>
  <script src="../js/seo-config.js"></script>
  <script src="../js/projects-data.js"></script>
  <script src="../js/main.js"></script>
  <script src="../js/project-page.js"></script>
  <script src="../js/barba-init.js"></script>
  <script src="../js/seo-meta.js"></script>
</body>
</html>`;
}

mkdirSync(join(root, 'projets'), { recursive: true });
for (const slug of order) {
  const p = extractProject(slug);
  if (!p) continue;
  writeFileSync(join(root, 'projets', slug + '.html'), page(slug, p));
  console.log('wrote', slug);
}
