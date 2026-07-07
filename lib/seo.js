/**
 * SEO — URLs du site et génération du sitemap
 */
const SITE_URL = (process.env.SITE_URL || 'https://maximefarineau.com').replace(/\/$/, '');

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/mentions-legales.html', priority: '0.3', changefreq: 'yearly' },
];

const PROJECT_SLUGS = [
  'saline-ceviche',
  'cap-nage',
  'simply-leads',
  'jmmc-shop',
  'laetitia-nutrition',
  'time-saving',
];

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ...STATIC_PAGES,
    ...PROJECT_SLUGS.map((slug) => ({
      path: `/projets/${slug}.html`,
      priority: '0.8',
      changefreq: 'monthly',
    })),
  ];

  const body = urls
    .map((u) => {
      const loc = u.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${u.path}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

module.exports = { SITE_URL, buildSitemap };
