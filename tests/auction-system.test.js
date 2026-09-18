const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRowsFromTimeline, mergeRows, parseCounts, displayAmount, buildFeed } = require('../scripts/sync-auction-live');
const rows = (...titles) => parseRowsFromTimeline(titles.map(title => ({ title })));

test('mixed auction clauses do not become combined player names', () => {
  const result = rows('Category (B): Amar Singh Routela unsold, Abhishek Tiwari sold to Bolts, 5 lakh');
  assert.deepEqual(result.map(row => [row.player, row.status, row.price]), [
    ['Amar Singh Routela', 'Unsold', '-'], ['Abhishek Tiwari', 'Sold', '5'],
  ]);
  assert.equal(result[1].team, 'Janakpur Bolts');
});

test('missing prices stay unknown and decimal prices remain exact', () => {
  assert.equal(rows('Sachin Bhatta sold for Sudurpaschim Royals')[0].price, '-');
  assert.equal(rows('Bibek Kumar Rana Magar sold to Pokhara Avengers - 2.75 lakh')[0].price, '2.75');
  assert.equal(displayAmount('-'), '-');
});

test('aggregate counts and commentary never become player rows', () => {
  assert.deepEqual(rows('37 players sold, 118 went unsold', 'Players to be bought for teams from Auction today'), []);
  assert.deepEqual(rows('Sunam Gautam, Dilsad Ali goes unsold').map(row => row.player), ['Sunam Gautam', 'Dilsad Ali']);
});

test('latest outcome wins across repeated auction rounds', () => {
  const timeline = rows('Amar Singh Routela sold to Janakpur Bolts, 5 lakh', 'Amar Singh Routela unsold');
  const merged = mergeRows([timeline[1]], timeline);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, 'Sold');
});

test('missing tracker totals fail closed instead of publishing guessed counts', () => {
  assert.throws(() => parseCounts('<html>Source layout changed</html>', []), /totals missing/);
  assert.deepEqual(parseCounts('Players 37 sold · 118 unsold · 155 in auction', []), {sold:37, unsold:118, total:155});
});

test('snapshot feed does not claim historical updates are live', () => {
  assert.equal(buildFeed([{isoTime:'2026-07-06T22:30:00+05:45',displayTime:'6 Jul, 10:30 pm'}]).status, 'Auction snapshot');
});
