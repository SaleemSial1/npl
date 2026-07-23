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

function siteHeader() {
  return `<header id="header">
    <div class="container">
        <div class="header-content">
            <div class="header-left">
                <div style="display:flex; align-items:center; justify-content:center; padding:10px;">
                    <a href="/" style="display:inline-block;">
                        <img src="/NPL Logo.png" alt="NPL Logo" style="width:100px; height:auto; object-fit:contain; display:block;">
                    </a>
                </div>
                <nav class="main-nav">
                    <a href="/" class="nav-link">Home</a>
                    <a href="/matches" class="nav-link">Matches</a>
                    <a href="/teams" class="nav-link">Teams</a>
                    <a href="/players" class="nav-link">Players</a>
                    <a href="/news" class="nav-link active">NEWS</a>
                    <a href="/schedule" class="nav-link">Schedule</a>
                    <a href="/points-table" class="nav-link">Points Table</a>
                    <a href="/tickets" class="nav-link">Tickets</a>
                    <a href="/auction" class="nav-link">Auction</a>
                </nav>
            </div>

            <div class="header-right">
                <div class="social-links">
                    <a href="https://facebook.com/nplcricketnepal" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                    <a href="https://twitter.com/nplcricketnepal" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
                    <a href="https://instagram.com/nplcricketnepal" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
                    <a href="https://youtube.com/@nplcricketnepal" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>
                </div>

                <div class="search-box">
                    <input type="text" placeholder="Search" class="search-input">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
            </div>

            <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
        </div>
    </div>
</header>`;
}

function siteFooter() {
  const indexPath = path.join(ROOT_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    const match = html.match(/<footer id="footer">[\s\S]*?<\/footer>/);
    if (match) return match[0];
  }
  return `<footer id="footer"><div class="container"><div class="footer-bottom"><div class="footer-copyright"><p>&copy; 2026 NPL Cricket League. Independent fan guide.</p></div></div></div></footer>`;
}

function pageScript() {
  return `<script>
document.addEventListener('DOMContentLoaded', function () {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.querySelector('.main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      mainNav.classList.toggle('active');
    });
  }
});
</script>`;
}

function pageShell({ title, description, canonical, body, image }) {
  const socialImage = image ? `${SITE_URL}/${image.replace(/^\/+/, '')}` : `${SITE_URL}/images/NPL.webp`;
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
<meta property="og:image" content="${escapeHtml(socialImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(socialImage)}">

<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" type="image/png" href="/NPL Logo.png">

<link rel="stylesheet" href="/styles.css">
<style>
  .main-content{padding-top:4rem}
  @media(min-width:768px){.main-content{padding-top:5rem}}
  .news-archive-meta{color:#d1d5db;font-size:1rem;margin-top:.5rem}
  .news-filter-bar{display:flex;gap:.65rem;flex-wrap:wrap;margin:0 0 1.5rem}
  .news-filter-bar a{border:1px solid rgba(6,182,212,.35);border-radius:8px;color:#e0f2fe;text-decoration:none;font-weight:700;padding:.55rem .75rem;background:rgba(17,24,39,.6)}
  .news-filter-bar a:hover{border-color:#06b6d4;color:#06b6d4}
  .news-article__hero{background:#0A0E1A;padding:3rem 1rem 2.25rem;color:#fff;border-bottom:1px solid rgba(6,182,212,.25)}
  .news-article__hero-grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(280px,.72fr);gap:2rem;align-items:center}
  .news-article__hero-copy{min-width:0}
  .news-article__hero h1{color:#06b6d4;font-size:clamp(2rem,5vw,3.35rem);line-height:1.08;margin:.5rem 0 1rem;max-width:880px}
  .news-article__hero p{color:#d1d5db;line-height:1.65;max-width:780px}
  .news-article__hero-media{border:1px solid rgba(250,204,21,.32);border-radius:8px;background:#111827;box-shadow:0 18px 40px rgba(0,0,0,.32);overflow:hidden}
  .news-article__hero-media img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
  .news-article__image-credit{display:block;color:#94a3b8;font-size:.78rem;line-height:1.35;padding:.7rem .85rem}
  .section__kicker{display:inline-block;color:#facc15;font-weight:800;text-transform:uppercase;margin-bottom:.5rem}
  .crumbs ol{list-style:none;display:flex;gap:.45rem;padding:0;margin:0 0 1rem;color:#93c5fd;flex-wrap:wrap}
  .crumbs a{color:#93c5fd;text-decoration:none}
  .news-article__meta{display:flex;gap:.75rem;flex-wrap:wrap;color:#e0f2fe;font-weight:800}
  .news-article__stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;margin-top:1.4rem;max-width:760px}
  .news-article__stat{border:1px solid rgba(6,182,212,.22);border-radius:8px;background:rgba(17,24,39,.85);padding:.85rem}
  .news-article__stat strong{display:block;color:#fff;font-size:1rem}
  .news-article__stats{display:none!important}
  .news-article__layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:2.5rem;padding:3rem 1rem;max-width:1180px;margin:0 auto}
  .news-article__body{background:#111827;border:1px solid rgba(6,182,212,.22);border-radius:12px;padding:2.5rem;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .news-article__body p{color:#e2e8f0;line-height:1.85;font-size:1.1rem;margin-bottom:1.75rem;letter-spacing:0.01em}
  .news-article__lead{font-size:1.25rem!important;font-weight:500;color:#ffffff!important;border-left:4px solid #06b6d4;padding-left:1.25rem;margin-bottom:2rem!important;line-height:1.85!important}
  .news-article__sources{display:none!important}
  .news-article__sources h2{font-size:1.15rem;color:#facc15;margin:0 0 .75rem}
  .news-article__sources ul{margin:0;padding-left:1.2rem}
  .news-article__sources li{margin:.45rem 0;color:#cbd5e1}
  .news-article__sources a{color:#93c5fd}
  .news-article__aside{background:#0f172a;border:1px solid rgba(250,204,21,.25);border-radius:8px;padding:1.25rem;height:max-content}
  .news-article__aside h2{font-size:1.2rem;color:#fff;margin:0 0 .9rem}
  .news-related-list{list-style:none;margin:0 0 1.2rem;padding:0;display:grid;gap:.75rem}
  .news-related-card{display:block;border:1px solid rgba(6,182,212,.18);border-radius:8px;padding:.85rem;text-decoration:none;background:#111827;color:#e5e7eb}
  .news-related-card:hover{border-color:#06b6d4;color:#fff}
  .news-related-card span{display:block;color:#facc15;font-size:.78rem;font-weight:800;margin-bottom:.25rem;text-transform:uppercase}
  .news-related-card strong{display:block;font-size:.95rem;line-height:1.35}
  .news-article__aside .btn{display:inline-flex;margin-top:.25rem}
  @media(max-width:900px){.news-article__hero-grid,.news-article__layout{grid-template-columns:1fr}.news-article__hero-media{max-width:620px}.news-article__stats{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.news-article__stats{grid-template-columns:1fr}.news-filter-bar a{flex:1 1 auto;text-align:center}.news-article__body{padding:1.25rem}}
</style>
</head>
<body>

${siteHeader()}
${body}
${siteFooter()}
${pageScript()}
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

function renderCard(item, index, anchor = '') {
  const id = anchor ? ` id="${escapeHtml(anchor)}"` : '';
  const category = normalizeAnchor(item.category || 'news') || 'news';
  const image = item.image || 'images/NPL.webp';
  return `                <a href="/news/${escapeHtml(item.slug)}.html" class="news-card-link"${id}>
                    <div class="news-card" data-category="${escapeHtml(category)}">
                        <div class="news-image-container">
                            <img src="/${escapeHtml(image)}" alt="${escapeHtml(item.title)}" class="news-image" loading="lazy" decoding="async">
                        </div>
                        <div class="news-content">
                            <div class="news-date">${escapeHtml(formatDate(item.date))}</div>
                            <h3 class="news-title">${escapeHtml(item.title)}</h3>
                            <p class="news-description">${escapeHtml(item.excerpt)}</p>
                            <span class="read-more">Read More -&gt;</span>
                        </div>
                    </div>
                </a>`;
}

function renderHomepageCard(item) {
  const category = normalizeAnchor(item.category || 'news') || 'news';
  const image = item.image ? `/${item.image}` : '/images/NPL.webp';
  return `                <a href="/news/${escapeHtml(item.slug)}.html" class="news-card-link">
                    <div class="news-card" data-category="${escapeHtml(category)}">
                        <div class="news-image-container">
                            <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" class="news-image" loading="lazy" decoding="async">
                        </div>
                        <div class="news-content">
                            <div class="news-date">${escapeHtml(formatDate(item.date))}</div>
                            <h3 class="news-title">${escapeHtml(item.title)}</h3>
                            <p class="news-description">${escapeHtml(item.excerpt)}</p>
                            <span class="read-more">Read More -&gt;</span>
                        </div>
                    </div>
                </a>`;
}

function renderHeroNewsCard(item) {
  const image = item.image ? `/${item.image}` : '/images/NPL.webp';
  return `                            <a href="/news/${escapeHtml(item.slug)}.html" class="hero-card hero-card--news">
                                <span class="card-tag">${escapeHtml(item.category || 'Latest News')} - ${escapeHtml(formatDate(item.date))}</span>
                                <h4 class="card-title">${escapeHtml(item.title)}</h4>
                                <div class="card-image">
                                    <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="eager" decoding="async">
                                </div>
                            </a>`;
}

function renderFeature(item) {
  if (!item) return '';
  const image = item.image || 'images/NPL.webp';
  return `<article class="news-hero__feature" aria-label="Featured NPL story">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">
      <div class="news-hero__feature-body">
        <span class="news-hero__label">Latest Auction Tracker</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.excerpt)}</p>
        <div class="news-hero__meta">
          <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>
          <span>${escapeHtml(item.category)}</span>
        </div>
        <a class="news-card__more" href="news/${escapeHtml(item.slug)}.html">Open lead story -&gt;</a>
      </div>
    </article>`;
}

function updateHomepageNewsSection(items) {
  const homepagePath = path.join(ROOT_DIR, 'index.html');
  if (!fs.existsSync(homepagePath)) return;

  const html = fs.readFileSync(homepagePath, 'utf8');
  const startMarker = '            <div class="news-grid" id="newsGrid">';
  const endMarker = '\n\n            <div class="news-cta">';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    throw new Error('Unable to locate homepage news grid in index.html');
  }

  const cards = items.slice(0, 4).map(renderHomepageCard).join('\n\n');
  const replacement = `${startMarker}
                <!-- Generated by scripts/generate-news-pages.js from data/news.json -->
${cards}
            </div>`;
  fs.writeFileSync(homepagePath, `${html.slice(0, start)}${replacement}${html.slice(end)}`);
}

function updateHomepageHeroNewsCards(items) {
  const homepagePath = path.join(ROOT_DIR, 'index.html');
  if (!fs.existsSync(homepagePath)) return;

  const html = fs.readFileSync(homepagePath, 'utf8');
  const startMarker = '                        <div class="hero-carousel-container" id="heroCarousel">';
  const containerEndMarker = '\n                        </div>\n                    </div>';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(containerEndMarker, start);
  if (start === -1 || end === -1) {
    throw new Error('Unable to locate homepage hero carousel in index.html');
  }

  const cards = items.slice(0, 4).map(renderHeroNewsCard).join('\n');
  const replacement = `${startMarker}
                            <!-- Generated by scripts/generate-news-pages.js from data/news.json -->
${cards}`;
  fs.writeFileSync(homepagePath, `${html.slice(0, start)}${replacement}${html.slice(end)}`);
}

function categoryFilters(items) {
  const categories = ['All', ...new Set(items.map((item) => item.category).filter(Boolean))];
  return categories
    .map((category) => {
      const href = category === 'All' ? '#news' : `#${normalizeAnchor(category)}-news`;
      return `<a href="${href}">${escapeHtml(category)}</a>`;
    })
    .join('\n    ');
}

function normalizeAnchor(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function archivePage(items) {
  const anchoredCategories = new Set();
  const cards = items.map((item, index) => {
    const category = normalizeAnchor(item.category);
    const anchor = category && !anchoredCategories.has(category) ? `${category}-news` : '';
    if (category) anchoredCategories.add(category);
    return renderCard(item, index, anchor);
  }).join('\n\n');
  const filters = categoryFilters(items);
  const body = `
<main class="main-content">
<section id="news" class="news-section">
  <div class="container">
    <div class="section-intro">
      <h1 class="section-title green">Latest News</h1>
    </div>

    <nav class="news-filter-bar" aria-label="News categories">
      ${filters}
    </nav>

    <div class="news-grid" id="newsGrid">
${cards}
    </div>
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
  const publishedAt = `${item.date}T00:00:00+05:45`;
  const modifiedAt = item.modifiedAt || `${item.date}T00:01:00+05:45`;
  const alternativeHeadline = item.alternativeHeadline || `${item.category} update for Nepal Premier League Season 3`;
  return `<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    alternativeHeadline,
    description: item.excerpt,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: { '@type': 'Organization', name: 'NPL Cricket League' },
    image: item.image ? `${SITE_URL}/${item.image.replace(/^\/+/, '')}` : `${SITE_URL}/images/NPL.webp`,
    publisher: {
      '@type': 'Organization',
      name: 'NPL Cricket League',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/NPL.webp`,
        width: 1024,
        height: 1024,
      },
    },
    mainEntityOfPage: `${SITE_URL}/news/${item.slug}`,
    about: ['NPL 2026', 'Nepal Premier League'],
    citation: Array.isArray(item.sources) ? item.sources.map((source) => source.url) : undefined,
  }, null, 2)}
</script>`;
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function readingMinutes(item) {
  const words = wordCount((item.body || []).join(' '));
  return Math.max(1, Math.ceil(words / 220));
}

function imageCredit(item) {
  if (!item.imageSource || !item.imageSource.name) return 'NPL Cricket League image';
  return item.imageSource.type === 'existing-site-asset'
    ? 'Restored NPL site image'
    : item.imageSource.name;
}

function relatedList(current, items) {
  return items
    .filter((item) => item.slug !== current.slug)
    .slice(0, 3)
    .map((item) => `<li><a class="news-related-card" href="${escapeHtml(item.slug)}.html"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong></a></li>`)
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
  const paragraphs = item.body
    .map((paragraph, index) => `<p${index === 0 ? ' class="news-article__lead"' : ''}>${escapeHtml(paragraph)}</p>`)
    .join('\n      ');
  const sourceCount = Array.isArray(item.sources) ? item.sources.length : 0;
  const articleImage = item.image || 'images/NPL.webp';
  const body = `
<main>
<article class="news-article">
  <header class="news-article__hero" style="--g1:${escapeHtml((item.colors || [])[0] || '#C62828')};--g2:${escapeHtml((item.colors || [])[1] || '#FFB800')};">
    <div class="news-article__hero-grid">
      <div class="news-article__hero-copy">
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
        <div class="news-article__stats" aria-label="Article details">
          <div class="news-article__stat"><span>Reading</span><strong>${readingMinutes(item)} min</strong></div>
          <div class="news-article__stat"><span>Sources</span><strong>${sourceCount}</strong></div>
          <div class="news-article__stat"><span>Words</span><strong>${wordCount((item.body || []).join(' ')).toLocaleString('en-US')}+</strong></div>
        </div>
      </div>
      <figure class="news-article__hero-media">
        <img src="../${escapeHtml(articleImage)}" alt="${escapeHtml(item.title)}" loading="eager" decoding="async">
        <figcaption class="news-article__image-credit">${escapeHtml(imageCredit(item))}</figcaption>
      </figure>
    </div>
  </header>

  <div class="news-article__layout">
    <div class="news-article__body">
      ${paragraphs}
      ${sourceList(item)}
    </div>
    <aside class="news-article__aside">
      <h2>More NPL News</h2>
      <ul class="news-related-list">
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
    image: articleImage,
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
  updateHomepageHeroNewsCards(items);
  updateHomepageNewsSection(items);
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
