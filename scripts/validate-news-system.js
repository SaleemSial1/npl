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

function run() {
  const items = loadNews();
  assert(items.length > 0, 'data/news.json must contain at least one NPL news item');

  const archivePath = path.join(ROOT_DIR, 'news.html');
  assert(fs.existsSync(archivePath), 'news.html was not generated');
  const archive = fs.readFileSync(archivePath, 'utf8');
  assert(archive.includes('NPL-only Newsroom'), 'news.html must declare the NPL-only newsroom');
  assert(!archive.includes('Premier League clubs'), 'news.html contains non-NPL football copy');

  for (const item of items) {
    const articlePath = path.join(NEWS_DIR, `${item.slug}.html`);
    assert(fs.existsSync(articlePath), `Missing generated article page: ${item.slug}`);
    const html = fs.readFileSync(articlePath, 'utf8');
    assert(html.includes(item.title), `Generated article missing title: ${item.slug}`);
    assert(html.includes('Nepal Premier League'), `Generated article missing NPL context: ${item.slug}`);
    assert(html.includes(`${SITE_URL}/news/${item.slug}`), `Generated article missing canonical URL: ${item.slug}`);
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
