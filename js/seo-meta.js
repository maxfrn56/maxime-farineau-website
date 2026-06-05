/* Mise à jour title / meta lors des transitions Barba */
(function () {
  const cfg = window.MF_SEO || {};
  const SITE = (cfg.siteUrl || '').replace(/\/$/, '');

  function setMeta(name, content, useProperty = false) {
    if (!content) return;
    const attr = useProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setCanonical(href) {
    if (!href) return;
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.rel = 'canonical';
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function applySeo({ title, description, path, image }) {
    if (title) document.title = title;
    if (description) setMeta('description', description);
    const url = path && SITE ? `${SITE}${path}` : '';
    if (url) {
      setCanonical(url);
      setMeta('og:url', url, true);
    }
    if (title) {
      setMeta('og:title', title, true);
      setMeta('twitter:title', title);
    }
    if (description) {
      setMeta('og:description', description, true);
      setMeta('twitter:description', description);
    }
    const img = image || cfg.defaultImage;
    if (img) {
      setMeta('og:image', img, true);
      setMeta('twitter:image', img);
    }
  }

  window.MF = window.MF || {};
  window.MF.applySeo = applySeo;

  window.addEventListener('mf:page-enter', (e) => {
    const { namespace, container } = e.detail || {};
    if (namespace === 'project') {
      const root =
        container?.querySelector?.('[data-project]') ||
        document.querySelector('[data-barba-namespace="project"] [data-project]');
      const slug = root?.dataset?.project;
      const p = window.PROJECTS?.[slug];
      if (!p) return;
      const desc = (p.description || `${p.title} — réalisé par Maxime Farineau`).slice(0, 160);
      applySeo({
        title: `${p.title} — Projet Web | Maxime Farineau`,
        description: desc,
        path: `/projets/${slug}.html`,
        image: cfg.defaultImage,
      });
      return;
    }
    if (namespace === 'home' && cfg.home) {
      applySeo({
        title: cfg.home.title,
        description: cfg.home.description,
        path: cfg.home.path,
        image: cfg.defaultImage,
      });
    }
  });
})();
