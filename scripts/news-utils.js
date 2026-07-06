const fs = require('node:fs');
const path = require('node:path');

const SITE_URL = 'https://nplcricketleague.com';
const ROOT_DIR = path.resolve(__dirname, '..');
const NEWS_DIR = path.join(ROOT_DIR, 'news');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'news.json');
const SOURCE_FILE = path.join(ROOT_DIR, 'data', 'news-sources.json');

const NPL_TERMS = [
  /\bNPL\s*2026\b/i,
  /\bNepal Premier League\b/i,
  /\bNepal\s+T20\b/i,
  /\bCricket Association of Nepal\b/i,
  /\bCAN\b.*\bNPL\b/i,
  /\bNPL\b.*\bcricket\b/i,
  /\bcricket\b.*\bNPL\b/i,
  /\bNPL\b.*\bNepal\b/i,
  /\bNepal\b.*\bNPL\b/i,
  /\bJanakpur Bolts\b/i,
  /\bSudurpaschim Royals\b/i,
  /\bChitwan Rhinos\b/i,
  /\bKarnali Yaks\b/i,
  /\bKathmandu Gurkhas\b/i,
  /\bKathmandu Gorkhas\b/i,
  /\bPokhara Avengers\b/i,
  /\bBiratnagar Kings\b/i,
  /\bLumbini Lions\b/i,
];

const EXCLUDE_TERMS = [
  /\bNational Physical Laboratory\b/i,
  /\bNational Premier League\b/i,
  /\bNational Pickleball League\b/i,
  /\bNepal Police\b/i,
  /\bIndian Premier League\b/i,
  /\bIPL\b/i,
  /\bPakistan Super League\b/i,
  /\bPSL\b/i,
  /\bLanka Premier League\b/i,
  /\bLPL\b/i,
  /\bCaribbean Premier League\b/i,
  /\bCPL\b/i,
  /\bEnglish Premier League\b/i,
  /\bPremier League clubs?\b/i,
  /\bfootball transfer\b/i,
  /\bFIFA\b/i,
  /\bUEFA\b/i,
  /\bChampions League\b/i,
  /\bLa Liga\b/i,
  /\bSerie A\b/i,
  /\bBundesliga\b/i,
];

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSlug(value) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function isNplNewsCandidate(item) {
  const contentHaystack = [
    item && item.title,
    item && item.description,
    item && item.excerpt,
    item && item.content,
    Array.isArray(item && item.body) ? item.body.join(' ') : item && item.body,
    item && item.category,
    item && item.link,
  ]
    .filter(Boolean)
    .join(' ');
  const haystack = [contentHaystack, item && item.source].filter(Boolean).join(' ');

  if (!contentHaystack.trim()) return false;
  if (EXCLUDE_TERMS.some((pattern) => pattern.test(haystack))) return false;
  const years = contentHaystack.match(/\b20\d{2}\b/g) || [];
  if (years.length && !years.includes('2026')) return false;
  return NPL_TERMS.some((pattern) => pattern.test(haystack));
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatDate(dateValue, options) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue || '');
  return new Intl.DateTimeFormat('en', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function validateNewsItem(item) {
  const required = ['slug', 'title', 'date', 'category', 'excerpt', 'body'];
  for (const field of required) {
    if (!item[field] || (Array.isArray(item[field]) && !item[field].length)) {
      throw new Error(`News item missing ${field}`);
    }
  }

  if (item.slug !== normalizeSlug(item.slug)) {
    throw new Error(`News item has invalid slug: ${item.slug}`);
  }

  if (!Array.isArray(item.body) || item.body.some((paragraph) => !String(paragraph).trim())) {
    throw new Error(`News item has empty body paragraph: ${item.slug}`);
  }

  if (!isNplNewsCandidate(item)) {
    throw new Error(`News item is not NPL-related: ${item.slug}`);
  }

  return true;
}

function loadNews() {
  const items = readJson(DATA_FILE, []);
  items.forEach(validateNewsItem);
  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  NPL_TERMS,
  DATA_FILE,
  NEWS_DIR,
  ROOT_DIR,
  SITE_URL,
  SOURCE_FILE,
  escapeHtml,
  formatDate,
  isNplNewsCandidate,
  loadNews,
  normalizeSlug,
  readJson,
  stripHtml,
  validateNewsItem,
};
