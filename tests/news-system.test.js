const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isNplNewsCandidate,
  normalizeSlug,
  readJson,
  validateNewsItem,
} = require('../scripts/news-utils');

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

test('latest NPL auction research article has image and source links', () => {
  const items = readJson(require('node:path').join(__dirname, '..', 'data', 'news.json'), []);
  const latest = items.find((item) => item.slug === 'npl-auction-season-3-live-updates-155-players-shortlisted');

  assert.ok(latest, 'latest NPL auction article must exist');
  assert.equal(latest.date, '2026-07-06');
  assert.equal(latest.image, 'images/news/npl-auction-season-3-live-updates.webp');
  assert.ok(Array.isArray(latest.sources), 'latest article must include research sources');
  assert.ok(latest.sources.length >= 3, 'latest article must include at least three research sources');
  assert.ok(latest.body.join(' ').includes('155 made the shortlist'));
});

test('each news article uses a unique generated image', () => {
  const items = readJson(require('node:path').join(__dirname, '..', 'data', 'news.json'), []);
  const imageToSlugs = new Map();

  for (const item of items) {
    assert.ok(item.image.startsWith('images/news/'), `${item.slug} must use a generated news image`);
    const slugs = imageToSlugs.get(item.image) || [];
    slugs.push(item.slug);
    imageToSlugs.set(item.image, slugs);
  }

  const duplicates = [...imageToSlugs.entries()].filter(([, slugs]) => slugs.length > 1);
  assert.deepEqual(duplicates, [], 'no image can be reused by multiple news articles');
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
