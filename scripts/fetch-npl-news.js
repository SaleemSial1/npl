const fs = require('node:fs');
const path = require('node:path');

const {
  ROOT_DIR,
  SOURCE_FILE,
  isNplNewsCandidate,
  normalizeSlug,
  readJson,
  stripHtml,
} = require('./news-utils');

function tagValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return stripHtml(match[1].replace(/<!\[CDATA\[|\]\]>/g, ''));
}

function parseRss(xml, sourceName) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return blocks.map((block) => ({
    source: sourceName,
    title: tagValue(block, 'title'),
    description: tagValue(block, 'description'),
    link: tagValue(block, 'link'),
    pubDate: tagValue(block, 'pubDate'),
  }));
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      'user-agent': 'NPLNewsBot/1.0 (+https://nplcricketleague.com/news.html)',
      accept: 'application/rss+xml, application/xml, text/xml, text/html',
    },
  });
  if (!response.ok) {
    throw new Error(`${source.name} returned HTTP ${response.status}`);
  }
  return parseRss(await response.text(), source.name);
}

async function run() {
  const config = readJson(SOURCE_FILE, { rss: [] });
  const collected = [];
  const failures = [];

  for (const source of config.rss || []) {
    try {
      const items = await fetchSource(source);
      collected.push(...items);
    } catch (error) {
      failures.push({ source: source.name, error: error.message });
    }
  }

  const seen = new Set();
  const candidates = collected
    .filter(isNplNewsCandidate)
    .map((item) => ({
      title: item.title,
      slug: normalizeSlug(item.title),
      source: item.source,
      link: item.link,
      pubDate: item.pubDate,
      description: item.description,
    }))
    .filter((item) => {
      if (!item.slug || seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });

  const cacheDir = path.join(ROOT_DIR, '.news-cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(path.join(cacheDir, 'source-articles.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), candidates, failures }, null, 2));

  const report = [
    `# NPL News Fetch Report`,
    ``,
    `Fetched: ${new Date().toISOString()}`,
    `Raw stories: ${collected.length}`,
    `NPL candidates: ${candidates.length}`,
    `Failed sources: ${failures.length}`,
    ``,
    ...candidates.map((item, index) => `${index + 1}. ${item.title}\n   Source: ${item.source}\n   URL: ${item.link}`),
    failures.length ? `\n## Failed Sources\n${failures.map((item) => `- ${item.source}: ${item.error}`).join('\n')}` : '',
  ].join('\n');

  fs.writeFileSync(path.join(cacheDir, 'source-articles.md'), report);
  console.log(`Fetched ${collected.length} raw stories; kept ${candidates.length} NPL-only candidates`);
  if (failures.length) console.log(`Failed sources: ${failures.length}`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { parseRss, run };
