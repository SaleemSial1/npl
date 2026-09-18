const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pages = ['', 'news', 'players', 'teams'].flatMap(dir => fs.readdirSync(path.join(root, dir))
  .filter(name => name.endsWith('.html')).map(name => path.join(root, dir, name)));

test('all page scripts and structured data parse', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/application\/ld\+json/.test(attributes)) assert.doesNotThrow(() => JSON.parse(body), file);
      else if (!/\bsrc\s*=/.test(attributes)) assert.doesNotThrow(() => new vm.Script(body), file);
    }
  }
});

test('search destinations and responsive hero assets exist', () => {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'data/search-index.json'), 'utf8'));
  for (const item of index) {
    assert.ok(item.url.startsWith('/') && !item.url.startsWith('//'));
    const file = item.url === '/' ? 'index.html' : `${item.url.slice(1)}.html`;
    assert.ok(fs.existsSync(path.join(root, file)), `Missing search destination: ${item.url}`);
  }
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, srcset] of home.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      assert.ok(fs.existsSync(path.join(root, url.slice(1))), `Missing responsive image: ${url}`);
    }
  }
});
