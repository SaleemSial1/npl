const fs = require('node:fs');
const path = require('node:path');

const {
  NEWS_DIR,
  ROOT_DIR,
  SITE_URL,
  escapeHtml,
  formatDate,
  loadNews,
} = require('./news-utils');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pageShell({ title, description, canonical, body, base = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0A0E1A">

<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${SITE_URL}/images/NPL.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE_URL}/images/NPL.webp">

<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" type="image/png" href="${base}NPL Logo.png">

<link rel="stylesheet" href="${base}styles.css">
<style>
  body{background:#0f172a;color:#e5e7eb}
  .generated-header{position:sticky;top:0;z-index:20;background:rgba(15,23,42,.96);border-bottom:1px solid rgba(6,182,212,.25)}
  .generated-header__inner{max-width:1180px;margin:0 auto;padding:.85rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .generated-brand{display:flex;align-items:center;gap:.7rem;color:#fff;text-decoration:none;font-weight:800}
  .generated-brand img{width:52px;height:auto}
  .generated-nav{display:flex;gap:1rem;flex-wrap:wrap}
  .generated-nav a{color:#d1d5db;text-decoration:none;font-weight:700;font-size:.92rem}
  .generated-nav a:hover{color:#06b6d4}
  .generated-footer{background:#020617;border-top:1px solid rgba(6,182,212,.22);padding:2rem 1rem;color:#9ca3af}
  .generated-footer__inner{max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
  .page-hero{background:linear-gradient(135deg,#111827,#1e3a8a);padding:4rem 1rem 3rem}
  .page-hero__inner,.section,.news-article__layout{max-width:1180px;margin:0 auto}
  .crumbs ol{list-style:none;display:flex;gap:.45rem;padding:0;margin:0 0 1rem;color:#93c5fd;flex-wrap:wrap}
  .crumbs a{color:#93c5fd;text-decoration:none}
  .section__kicker{display:inline-block;color:#facc15;font-weight:800;text-transform:uppercase;letter-spacing:0;margin-bottom:.75rem}
  .page-hero__title,.news-article__hero h1{color:#fff;font-size:clamp(2rem,5vw,4rem);line-height:1.08;margin:.25rem 0 1rem}
  .page-hero__sub,.section__sub,.news-article__hero p{color:#d1d5db;line-height:1.65;max-width:820px}
  .page-hero__meta{display:flex;gap:1rem;flex-wrap:wrap;color:#bfdbfe;font-weight:700}
  .ul-gold,.ul-teal{color:#facc15}
  .section{padding:3rem 1rem}
  .section__title{font-size:clamp(1.6rem,3vw,2.5rem);color:#fff;margin:.2rem 0 .75rem}
  .news{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem}
  .news-card{background:linear-gradient(145deg,#1e3a8a,#111827);border:1px solid rgba(6,182,212,.28);border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
  .news-card--featured{grid-column:span 2}
  .news-card__img{height:210px;background:linear-gradient(135deg,var(--g1),var(--g2));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
  .news-card__teamlogo{width:100%;height:100%;object-fit:cover;display:block}
  .news-card__tag{position:absolute;top:.8rem;right:.8rem;background:#06b6d4;color:#fff;border-radius:8px;padding:.35rem .65rem;font-size:.78rem;font-weight:800}
  .news-card__tag--gold{background:#facc15;color:#111827}
  .news-card__body{padding:1.25rem;display:flex;flex-direction:column;gap:.7rem;flex:1}
  .news-card__body time{color:#34d399;font-weight:700}
  .news-card__body h3{color:#fff;font-size:1.12rem;line-height:1.35;margin:0}
  .news-card__body p{color:#cbd5e1;line-height:1.55;margin:0}
  .news-card__more,.btn{color:#06b6d4;font-weight:800;text-decoration:none;margin-top:auto}
  .news-article__hero{background:linear-gradient(135deg,var(--g1),var(--g2));padding:4rem 1rem;color:#fff}
  .news-article__hero>*{max-width:980px;margin-left:auto;margin-right:auto}
  .news-article__meta{display:flex;gap:.75rem;flex-wrap:wrap;color:#e0f2fe;font-weight:800}
  .news-article__layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:2rem;padding:3rem 1rem}
  .news-article__body{background:#111827;border:1px solid rgba(6,182,212,.22);border-radius:8px;padding:2rem}
  .news-article__body p{color:#e5e7eb;line-height:1.75;font-size:1.05rem}
  .news-article__sources{margin-top:2rem;padding-top:1.25rem;border-top:1px solid rgba(6,182,212,.22)}
  .news-article__sources h2{font-size:1.15rem;color:#facc15;margin:0 0 .75rem}
  .news-article__sources ul{margin:0;padding-left:1.2rem}
  .news-article__sources li{margin:.45rem 0;color:#cbd5e1}
  .news-article__sources a{color:#93c5fd}
  .news-article__aside{background:#0f172a;border:1px solid rgba(250,204,21,.25);border-radius:8px;padding:1.25rem;height:max-content}
  .news-article__aside img{width:100%;max-width:100%;border-radius:8px;display:block;margin:0 auto 1rem}
  .news-article__aside h2{font-size:1.2rem;color:#fff}
  .news-article__aside a{color:#93c5fd}
  @media(max-width:760px){.generated-header__inner,.generated-footer__inner{align-items:flex-start;flex-direction:column}.news-card--featured{grid-column:auto}.news-article__layout{grid-template-columns:1fr}.generated-nav{gap:.65rem}.generated-nav a{font-size:.86rem}}
</style>
</head>
<body>

<header class="generated-header">
  <div class="generated-header__inner">
    <a class="generated-brand" href="${base}index.html"><img src="${base}NPL Logo.png" alt="NPL Logo"><span>Nepal Premier League</span></a>
    <nav class="generated-nav" aria-label="Main navigation">
      <a href="${base}index.html">Home</a>
      <a href="${base}matches.html">Matches</a>
      <a href="${base}teams.html">Teams</a>
      <a href="${base}players.html">Players</a>
      <a href="${base}news.html">News</a>
      <a href="${base}schedule.html">Schedule</a>
      <a href="${base}points-table.html">Points Table</a>
    </nav>
  </div>
</header>
${body}
<footer class="generated-footer">
  <div class="generated-footer__inner">
    <span>&copy; 2026 Nepal Premier League. All rights reserved.</span>
    <span>NPL-only news, filtered for Nepal Premier League coverage.</span>
  </div>
</footer>
</body>
</html>
`;
}

function newsArtwork(item, base = '') {
  const colors = item.colors || ['#C62828', '#FFB800'];
  const image = item.image ? `${base}${item.image}` : `${base}images/NPL.webp`;
  return `<div class="news-card__img" style="--g1:${escapeHtml(colors[0])};--g2:${escapeHtml(colors[1])};">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" class="news-card__teamlogo">
        <span class="news-card__tag${item.category === 'Draft' ? ' news-card__tag--gold' : ''}">${escapeHtml(item.category)}</span>
      </div>`;
}

function renderCard(item, index) {
  return `    <article class="news-card${index === 0 ? ' news-card--featured' : ''}">
      ${newsArtwork(item)}
      <div class="news-card__body">
        <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.excerpt)}</p>
        <a class="news-card__more" href="news/${escapeHtml(item.slug)}.html">Read more -&gt;</a>
      </div>
    </article>`;
}

function archivePage(items) {
  const cards = items.map(renderCard).join('\n\n');
  const latest = items[0];
  const body = `
<main>
<section class="page-hero" data-screen-label="News Hero">
  <div class="page-hero__inner">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
    <li><a href="index.html">Home</a></li>
        <li class="crumbs__sep" aria-hidden="true">›</li>
        <li aria-current="page">News</li>
      </ol>
    </nav>
    <span class="section__kicker">NPL-only Newsroom</span>
    <h1 class="page-hero__title">NPL 2026 <span class="ul-gold">Latest News</span></h1>
    <p class="page-hero__sub">Only NPL 2026 and Nepal Premier League updates: teams, schedule, venues, draft, squads and tournament build-up.</p>
    <p class="page-hero__meta"><span>Latest: <strong>${escapeHtml(latest ? formatDate(latest.date) : 'No posts yet')}</strong></span><span>${items.length} NPL stories</span></p>
  </div>
</section>

<section class="section" id="news" data-screen-label="News Grid">
  <header class="section__head">
    <span class="section__kicker">Updates</span>
    <h2 class="section__title">Nepal Premier League <span class="ul-teal">Headlines</span></h2>
    <p class="section__sub">This feed is intentionally filtered to NPL and Nepal Premier League stories only.</p>
  </header>

  <div class="news">
${cards}
  </div>
</section>
</main>`;

  return pageShell({
    title: 'NPL 2026 News - Latest Nepal Premier League Updates',
    description: 'Latest NPL 2026 and Nepal Premier League news: draft, teams, squads, schedule, venues and tournament updates.',
    canonical: `${SITE_URL}/news`,
    body,
  });
}

function articleJsonLd(item) {
  return `<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.excerpt,
    datePublished: item.date,
    dateModified: item.date,
    author: { '@type': 'Organization', name: 'NPL 2026 Fan Hub' },
    publisher: {
      '@type': 'Organization',
      name: 'NPL 2026',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/NPL.webp` },
    },
    mainEntityOfPage: `${SITE_URL}/news/${item.slug}`,
    about: ['NPL 2026', 'Nepal Premier League'],
    citation: Array.isArray(item.sources) ? item.sources.map((source) => source.url) : undefined,
  }, null, 2)}
</script>`;
}

function relatedList(current, items) {
  return items
    .filter((item) => item.slug !== current.slug)
    .slice(0, 3)
    .map((item) => `<li><a href="${escapeHtml(item.slug)}.html">${escapeHtml(item.title)}</a></li>`)
    .join('\n');
}

function sourceList(item) {
  if (!Array.isArray(item.sources) || !item.sources.length) return '';
  return `<section class="news-article__sources">
      <h2>Research Sources</h2>
      <ul>
${item.sources.map((source) => `        <li><a href="${escapeHtml(source.url)}" rel="nofollow noopener" target="_blank">${escapeHtml(source.name || source.url)}</a></li>`).join('\n')}
      </ul>
    </section>`;
}

function articlePage(item, items) {
  const paragraphs = item.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n      ');
  const body = `
<main>
<article class="news-article">
  <header class="news-article__hero" style="--g1:${escapeHtml((item.colors || [])[0] || '#C62828')};--g2:${escapeHtml((item.colors || [])[1] || '#FFB800')};">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="../index.html">Home</a></li>
        <li class="crumbs__sep" aria-hidden="true">›</li>
        <li><a href="../news.html">News</a></li>
        <li class="crumbs__sep" aria-hidden="true">›</li>
        <li aria-current="page">${escapeHtml(item.category)}</li>
      </ol>
    </nav>
    <span class="section__kicker">${escapeHtml(item.category)}</span>
    <h1>${escapeHtml(item.title)}</h1>
    <p>${escapeHtml(item.excerpt)}</p>
    <div class="news-article__meta">
      <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>
      <span>NPL 2026</span>
      <span>Nepal Premier League</span>
    </div>
  </header>

  <div class="news-article__layout">
    <div class="news-article__body">
      ${paragraphs}
      ${sourceList(item)}
    </div>
    <aside class="news-article__aside">
      <div class="news-article__logo">
        <img src="../${escapeHtml(item.image || 'images/NPL.webp')}" alt="${escapeHtml(item.title)}">
      </div>
      <h2>More NPL News</h2>
      <ul>
${relatedList(item, items)}
      </ul>
      <a class="btn btn--ghost" href="../news.html">All News</a>
    </aside>
  </div>
</article>
${articleJsonLd(item)}
</main>`;

  return pageShell({
    title: `${item.title} - NPL 2026 News`,
    description: item.excerpt,
    canonical: `${SITE_URL}/news/${item.slug}`,
    body,
    base: '../',
  });
}

function buildNewsSitemap(items) {
  const urls = [
    { loc: `${SITE_URL}/news`, lastmod: items[0] ? items[0].date : '2026-07-06', priority: '0.8', changefreq: 'daily' },
    ...items.map((item) => ({
      loc: `${SITE_URL}/news/${item.slug}`,
      lastmod: item.date,
      priority: '0.7',
      changefreq: 'weekly',
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><lastmod>${url.lastmod}</lastmod><loc>${url.loc}</loc><priority>${url.priority}</priority><changefreq>${url.changefreq}</changefreq></url>`).join('\n')}
</urlset>
`;
}

function updateMainSitemap(items) {
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return;

  const current = fs.readFileSync(sitemapPath, 'utf8');
  const withoutGenerated = current
    .replace(/\n  <url><lastmod>[^<]+<\/lastmod><loc>https:\/\/nplcricketleague\.com\/news\/[^<]+<\/loc><priority>0\.7<\/priority><changefreq>weekly<\/changefreq><\/url>/g, '')
    .replace(/\n  <!-- NPL news articles generated by scripts\/generate-news-pages\.js -->[\s\S]*?  <!-- End NPL news articles -->/g, '');

  const block = `\n  <!-- NPL news articles generated by scripts/generate-news-pages.js -->\n${items.map((item) => `  <url><lastmod>${item.date}</lastmod><loc>${SITE_URL}/news/${item.slug}</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>`).join('\n')}\n  <!-- End NPL news articles -->\n`;
  const updated = withoutGenerated.replace('\n</urlset>', `${block}</urlset>`);
  fs.writeFileSync(sitemapPath, updated);
}

function run() {
  const items = loadNews();
  ensureDir(NEWS_DIR);
  fs.writeFileSync(path.join(ROOT_DIR, 'news.html'), archivePage(items));
  for (const item of items) {
    fs.writeFileSync(path.join(NEWS_DIR, `${item.slug}.html`), articlePage(item, items));
  }
  fs.writeFileSync(path.join(ROOT_DIR, 'news-sitemap.xml'), buildNewsSitemap(items));
  updateMainSitemap(items);
  console.log(`Generated ${items.length} NPL news articles, news.html, and news-sitemap.xml`);
}

if (require.main === module) {
  run();
}

module.exports = { run };
