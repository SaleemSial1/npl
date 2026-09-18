const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function decode(text) {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function generateSearchIndex() {
  const entries = [];
  for (const directory of ['', 'teams', 'players', 'news']) {
    for (const name of fs.readdirSync(path.join(root, directory)).sort()) {
      if (!name.endsWith('.html')) continue;
      const html = fs.readFileSync(path.join(root, directory, name), 'utf8');
      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
      if (!title || /<meta[^>]*content="[^"]*noindex/i.test(html)) continue;
      const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || title;
      entries.push({title:decode(heading), url:name === 'index.html' && !directory ? '/' : `/${directory ? directory + '/' : ''}${name.slice(0,-5)}`, keywords:decode(title)});
    }
  }
  fs.writeFileSync(path.join(root, 'data/search-index.json'), JSON.stringify(entries, null, 2) + '\n');
  console.log(`Indexed ${entries.length} site pages`);
}
if (require.main === module) generateSearchIndex();
module.exports = { generateSearchIndex };
