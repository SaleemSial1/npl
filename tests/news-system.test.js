const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isNplNewsCandidate,
  normalizeSlug,
  readJson,
  validateNewsItem,
} = require('../scripts/news-utils');

const DEEP_RESEARCH_SLUGS = [
  'nepal-premier-league-category-c-17-players-signed-in-auction',
  'nepal-premier-league-player-auction-begins-season-3',
  'nepal-premier-league-2026-auction-live-streaming-guide',
];

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
];

const SOURCE_NAME_PATTERNS = [
  /\bRatopati\b/i,
  /\bCricnepal\b/i,
  /\bSportsdunia\b/i,
  /\bKathmandu Post\b/i,
  /\bHimalPress\b/i,
];

function articleWords(item) {
  return item.body.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

test('NPL filter accepts Nepal Premier League cricket stories only', () => {
  assert.equal(
    isNplNewsCandidate({
      title: 'Nepal Premier League 2026 auction attracts record player interest',
      description: 'NPL franchises prepare for the Season 3 cricket auction in Kathmandu.',
    }),
    true
  );

  assert.equal(
    isNplNewsCandidate({
      title: 'NPL scientists publish new measurement standard',
      description: 'A National Physical Laboratory update with no Nepal cricket relevance.',
    }),
    false
  );

  assert.equal(
    isNplNewsCandidate({
      title: 'Indian Premier League clubs review auction plans',
      description: 'IPL cricket franchises are preparing for the new season.',
    }),
    false
  );
});

test('slug normalizer creates stable NPL article paths', () => {
  assert.equal(
    normalizeSlug('Nepal Premier League 2026: Season 3 Mega Auction Update!'),
    'nepal-premier-league-2026-season-3-mega-auction-update'
  );
});

test('news item validation reads local excerpt and body fields', () => {
  assert.doesNotThrow(() =>
    validateNewsItem({
      slug: 'npl-season-3-mega-auction-july-6',
      title: 'NPL Season 3 Mega Auction will be held on July 6, 2026',
      date: '2026-07-06',
      category: 'Auction',
      excerpt: 'The Nepal Premier League Season 3 auction is the next NPL 2026 squad-building checkpoint.',
      body: ['All eight Nepal Premier League franchises will use the NPL auction to complete key cricket roles.'],
    })
  );
});

test('latest NPL auction research article has web image and source links', () => {
  const items = readJson(require('node:path').join(__dirname, '..', 'data', 'news.json'), []);
  const latest = items.find((item) => item.slug === 'nepal-premier-league-category-c-17-players-signed-in-auction');

  assert.ok(latest, 'latest NPL auction article must exist');
  assert.equal(latest.date, '2026-07-06');
  assert.equal(latest.image, 'images/news/nepal-premier-league-category-c-17-players-signed-in-auction.jpg');
  assert.equal(latest.imageSource.discovery, 'google-search');
  assert.ok(/^https?:\/\//.test(latest.imageSource.url), 'latest article must keep the original web image URL');
  assert.ok(Array.isArray(latest.sources), 'latest article must include research sources');
  assert.ok(latest.sources.length >= 3, 'latest article must include at least three research sources');
  assert.ok(latest.body.join(' ').includes('Seventeen Category C players'));
});

test('news images use Google sources for new articles and restored site assets for old articles', () => {
  const items = readJson(require('node:path').join(__dirname, '..', 'data', 'news.json'), []);
  const imageToSlugs = new Map();
  const newGoogleImageSlugs = new Set([
    'nepal-premier-league-category-c-17-players-signed-in-auction',
    'nepal-premier-league-player-auction-begins-season-3',
    'nepal-premier-league-2026-auction-live-streaming-guide',
  ]);
  const restoredLegacyImages = new Map([
    ['npl-auction-season-3-live-updates-155-players-shortlisted', 'images/npl-auction.webp'],
    ['npl-season-3-mega-auction-july-6', 'images/npl-season-3-mega-auction.webp'],
    ['kantipur-max-to-broadcast-nepal-premier-league-2026', 'images/kantipur-max-to-broadcast-npl.webp'],
    ['dish-home-go-app-nepal-premier-league-streaming-guide', 'images/npl-streaming.webp'],
    ['nepal-premier-league-2026-teams-prepare-for-season-3', 'images/npl-teams.webp'],
    ['international-stars-to-feature-in-nepal-premier-league-2026', 'images/npl-all-players.webp'],
  ]);

  for (const item of items) {
    assert.ok(item.image.startsWith('images/'), `${item.slug} must use a local image`);
    assert.ok(item.imageSource, `${item.slug} must include image source metadata`);
    assert.notEqual(item.imageSource.type, 'ai-generated', `${item.slug} image must not be AI-generated`);
    if (newGoogleImageSlugs.has(item.slug)) {
      assert.equal(item.imageSource.discovery, 'google-search', `${item.slug} image must be selected from web/Google search`);
      assert.ok(/^https?:\/\//.test(item.imageSource.url), `${item.slug} must keep the original image URL`);
    }
    if (restoredLegacyImages.has(item.slug)) {
      assert.equal(item.image, restoredLegacyImages.get(item.slug), `${item.slug} must use restored old site image`);
      assert.equal(item.imageSource.discovery, 'site-asset', `${item.slug} must use restored old site asset`);
    }
    const slugs = imageToSlugs.get(item.image) || [];
    slugs.push(item.slug);
    imageToSlugs.set(item.image, slugs);
  }

  const duplicates = [...imageToSlugs.entries()].filter(([, slugs]) => slugs.length > 1);
  assert.deepEqual(duplicates, [], 'no image can be reused by multiple news articles');
});

test('generated archive keeps the same site design system as other pages', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const archive = fs.readFileSync(path.join(__dirname, '..', 'news.html'), 'utf8');

  assert.ok(archive.includes('<header id="header">'), 'archive must use the shared site header');
  assert.ok(archive.includes('<footer id="footer">'), 'archive must use the shared site footer');
  assert.ok(archive.includes('<section id="news" class="news-section">'), 'archive must use the existing news section layout');
  assert.ok(archive.includes('class="news-grid" id="newsGrid"'), 'archive must use the existing news grid');
  assert.ok(!archive.includes('generated-header'), 'archive must not use a custom generated header');
  assert.ok(!archive.includes('page-hero'), 'archive must not use a custom page hero design');
  assert.ok(!archive.includes('generated image asset'), 'archive must not describe article images as generated');
  assert.ok(!archive.includes('from the Our comprehensive coverage'), 'archive must not include broken old intro copy');
});

test('homepage news section shows the latest generated NPL articles', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const items = readJson(path.join(__dirname, '..', 'data', 'news.json'), [])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);
  const section = homepage.match(/<section id="news" class="news-section">[\s\S]*?<\/section>/);

  assert.ok(section, 'homepage must include the latest news section');
  for (const item of items) {
    assert.ok(section[0].includes(item.title), `homepage news must include ${item.slug}`);
    assert.ok(section[0].includes(`news/${item.slug}.html`), `homepage news must link to generated article ${item.slug}`);
  }
  assert.ok(!section[0].includes('August 09, 2026'), 'homepage news must not show stale future-dated auction placeholder');
  assert.ok(!section[0].includes('November 09, 2026'), 'homepage news must not show stale future-dated player/team placeholders');
});

test('homepage hero carousel shows the latest generated NPL news', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const items = readJson(path.join(__dirname, '..', 'data', 'news.json'), [])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);
  const heroCarousel = homepage.match(/<div class="hero-carousel-container" id="heroCarousel">[\s\S]*?<\/div>\s*<\/div>\s*<div class="carousel-controls">/);

  assert.ok(heroCarousel, 'homepage must include the hero carousel');
  for (const item of items) {
    assert.ok(heroCarousel[0].includes(item.title), `hero carousel must include ${item.slug}`);
    assert.ok(heroCarousel[0].includes(`/news/${item.slug}.html`), `hero carousel must link to generated article ${item.slug}`);
  }
  assert.ok(!heroCarousel[0].includes('Kathmandu Gurkhas vs Sudurpaschim Royals Live Streaming'), 'hero carousel must not keep stale match cards');
});

test('homepage hero keeps the old schedule call-to-action button', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const heroText = homepage.match(/<div class="hero-text">[\s\S]*?<\/div>\s*<div class="hero-cards">/);

  assert.ok(heroText, 'homepage must include hero text');
  assert.ok(heroText[0].includes('href="https://nplcricketleague.com/schedule" class="btn-primary">Schedule</a>'), 'hero must keep the old Schedule button');
  assert.ok(!heroText[0].includes('Auction Tracker</a>'), 'hero must not show the replacement Auction Tracker button');
  assert.ok(!heroText[0].includes('Latest News</a>'), 'hero must not show the replacement Latest News button');
  assert.ok(!heroText[0].includes('hero-facts'), 'hero must not show the auction stats block');
  assert.ok(!heroText[0].includes('shortlisted players'), 'hero must not show shortlisted players copy');
  assert.ok(!heroText[0].includes('auction slots'), 'hero must not show auction slots copy');
  assert.ok(!heroText[0].includes('franchises'), 'hero must not show franchises copy');
});

test('homepage matches section shows the next four match cards', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  const matchesSection = homepage.match(/<section id="matches" class="matches-section">[\s\S]*?<\/section>/);

  assert.ok(matchesSection, 'homepage must include matches section');
  for (let matchNumber = 1; matchNumber <= 4; matchNumber += 1) {
    assert.ok(matchesSection[0].includes(`<div class="match-label">Match ${matchNumber}</div>`), `homepage must include Match ${matchNumber}`);
    const start = matchesSection[0].indexOf(`<!-- Match ${matchNumber} -->`);
    const end = matchNumber < 4 ? matchesSection[0].indexOf(`<!-- Match ${matchNumber + 1} -->`, start) : matchesSection[0].indexOf(`<!-- Match 5 -->`, start);
    const cardHtml = matchesSection[0].slice(start, end);
    const openingDivs = (cardHtml.match(/<div\b/g) || []).length;
    const closingDivs = (cardHtml.match(/<\/div>/g) || []).length;
    assert.equal(openingDivs, closingDivs, `Match ${matchNumber} card markup must be balanced`);
  }
  assert.ok(styles.includes('.match-card:nth-child(n+5)'), 'homepage must hide matches after the first four');
  assert.ok(!styles.includes('.match-card:nth-child(n+3)'), 'homepage must not hide Match 3 and Match 4');
  assert.ok(styles.includes('.matches-grid {\n  display: grid;'), 'homepage matches must render as a grid so all four cards are visible');
  assert.ok(
    /@media \(min-width: 1180px\)\s*{\s*\.matches-grid\s*{\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/m.test(styles),
    'wide desktop must show four match cards in one row'
  );
  assert.ok(homepage.includes('const visibleMatchCards = document.querySelectorAll(\'.match-card:not([hidden])\');'), 'matches carousel must count only visible homepage match cards');
});

test('latest published auction batch has 900 plus words and deep sourcing', () => {
  const path = require('node:path');
  const items = readJson(path.join(__dirname, '..', 'data', 'news.json'), []);

  for (const slug of DEEP_RESEARCH_SLUGS) {
    const item = items.find((entry) => entry.slug === slug);
    assert.ok(item, `${slug} must be published`);
    const wordCount = articleWords(item);
    assert.ok(wordCount >= 900, `${slug} must have 900+ words, got ${wordCount}`);
    assert.ok(Array.isArray(item.sources) && item.sources.length >= 3, `${slug} must have at least three research sources`);
    assert.ok(item.imageSource && item.imageSource.discovery === 'google-search', `${slug} must use a searched web image`);
    assert.ok(item.body.join(' ').includes('Nepal Premier League'), `${slug} must stay NPL-focused`);
  }
});

test('NPL news writing rules are copied into this repo', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const rules = fs.readFileSync(path.join(__dirname, '..', 'AGENTS.md'), 'utf8');

  assert.ok(rules.includes('New NPL news articles must be at least 900 words'), 'rules must lock 900+ word NPL news depth');
  assert.ok(rules.includes('Use Google News or search only as a discovery layer'), 'rules must require original source verification');
  assert.ok(rules.includes('Do not write source names inside normal article body prose'), 'rules must hide source names from article body prose');
  assert.ok(rules.includes('`dateModified` must differ from `datePublished`'), 'rules must lock schema date separation');
  assert.ok(rules.includes('Do not use AI-generated news images'), 'rules must keep image sourcing lock');
});

test('latest deep-research articles follow NPL news writing rules', () => {
  const path = require('node:path');
  const items = readJson(path.join(__dirname, '..', 'data', 'news.json'), []);

  for (const slug of DEEP_RESEARCH_SLUGS) {
    const item = items.find((entry) => entry.slug === slug);
    assert.ok(item, `${slug} must exist`);
    const body = item.body.join('\n');
    const banned = BANNED_NEWS_PATTERNS.filter((pattern) => pattern.test(body)).map((pattern) => pattern.source);
    const sourceNames = SOURCE_NAME_PATTERNS.filter((pattern) => pattern.test(body)).map((pattern) => pattern.source);

    assert.deepEqual(banned, [], `${slug} must not contain banned news-writing language`);
    assert.deepEqual(sourceNames, [], `${slug} must keep source names out of body prose`);
    assert.ok(articleWords(item) >= 900, `${slug} must stay 900+ words after editorial cleanup`);
  }
});

test('generated article schema follows NPL news writing rules', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  for (const slug of DEEP_RESEARCH_SLUGS) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'news', `${slug}.html`), 'utf8');
    const jsonMatch = html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/);
    assert.ok(jsonMatch, `${slug} must include JSON-LD`);
    const schema = JSON.parse(jsonMatch[1]);

    assert.equal(schema['@type'], 'NewsArticle');
    assert.notEqual(schema.datePublished, schema.dateModified, `${slug} dateModified must differ from datePublished`);
    assert.notEqual(schema.alternativeHeadline, schema.headline, `${slug} alternativeHeadline must differ from headline`);
    assert.equal(schema.publisher.logo.width, 1024, `${slug} publisher logo width must be set`);
    assert.equal(schema.publisher.logo.height, 1024, `${slug} publisher logo height must be set`);
    assert.ok(!html.includes('"@type": "FAQPage"'), `${slug} must not include FAQPage schema without visible FAQ support`);
  }
});

test('news item validation rejects non-NPL content', () => {
  assert.throws(
    () =>
      validateNewsItem({
        slug: 'ipl-auction-window',
        title: 'Indian Premier League auction window latest',
        date: '2026-07-06',
        category: 'Cricket',
        excerpt: 'IPL franchises continue talks.',
        body: ['This story is not about Nepal Premier League cricket.'],
      }),
    /not NPL-related/
  );
});
