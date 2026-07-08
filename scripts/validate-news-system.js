const fs = require('node:fs');
const path = require('node:path');

const {
  NEWS_DIR,
  ROOT_DIR,
  SITE_URL,
  loadNews,
} = require('./news-utils');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const BANNED_NEWS_PATTERNS = [
  /\bhowever\b/i,
  /\bfurthermore\b/i,
  /\badditionally\b/i,
  /\btherefore\b/i,
  /\bmeanwhile\b/i,
  /\bnotably\b/i,
  /according to sources/i,
  /according to reports/i,
  /as reported by/i,
  /\bthis page\b/i,
  /\bthis article\b/i,
  /the table below shows/i,
  /the following table/i,
  /here is a summary/i,
  /in a recent development/i,
  /things are heating up/i,
  /the countdown is on/i,
  /there is growing excitement/i,
  /with just weeks to go/i,
  /\bcycle\b/i,
];

function articleWords(item) {
  return (item.body || []).join(' ').trim().split(/\s+/).filter(Boolean).length;
}

function run() {
  const items = loadNews();
  assert(items.length > 0, 'data/news.json must contain at least one NPL news item');

  const archivePath = path.join(ROOT_DIR, 'news.html');
  assert(fs.existsSync(archivePath), 'news.html was not generated');
  const archive = fs.readFileSync(archivePath, 'utf8');
  assert(archive.includes('<section id="news" class="news-section">'), 'news.html must use the shared news section layout');
  assert(archive.includes('Latest News'), 'news.html must declare latest news');
  assert(!archive.includes('Premier League clubs'), 'news.html contains non-NPL football copy');

  for (const item of items) {
    const bodyText = (item.body || []).join(' ');
    assert(articleWords(item) >= 900, `${item.slug} must have at least 900 body words`);
    assert(Array.isArray(item.sources) && item.sources.length >= 3, `${item.slug} must include at least three research sources`);
    assert(item.image && item.image.startsWith('images/'), `${item.slug} must use a local image`);
    assert(item.imageSource, `${item.slug} must include imageSource metadata`);
    assert(item.imageSource.type !== 'ai-generated', `${item.slug} must not use an AI-generated image`);
    for (const pattern of BANNED_NEWS_PATTERNS) {
      assert(!pattern.test(bodyText), `${item.slug} contains banned body wording: ${pattern}`);
    }

    const articlePath = path.join(NEWS_DIR, `${item.slug}.html`);
    assert(fs.existsSync(articlePath), `Missing generated article page: ${item.slug}`);
    const html = fs.readFileSync(articlePath, 'utf8');
    assert(html.includes(item.title), `Generated article missing title: ${item.slug}`);
    assert(html.includes('Nepal Premier League'), `Generated article missing NPL context: ${item.slug}`);
    assert(html.includes(`${SITE_URL}/news/${item.slug}`), `Generated article missing canonical URL: ${item.slug}`);
    assert(html.includes('class="news-article__hero-grid"'), `Generated article missing improved hero layout: ${item.slug}`);
    assert(html.includes('class="news-article__lead"'), `Generated article missing lead paragraph styling: ${item.slug}`);
    assert(html.includes('Research Sources'), `Generated article missing source block: ${item.slug}`);
  }

  const newsSitemap = path.join(ROOT_DIR, 'news-sitemap.xml');
  assert(fs.existsSync(newsSitemap), 'news-sitemap.xml was not generated');
  const sitemap = fs.readFileSync(newsSitemap, 'utf8');
  for (const item of items) {
    assert(sitemap.includes(`${SITE_URL}/news/${item.slug}`), `news-sitemap.xml missing ${item.slug}`);
  }

  console.log(`Validated ${items.length} NPL-only news articles`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { run };
