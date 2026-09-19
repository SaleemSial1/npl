const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const RESEARCH_DIR = path.join(ROOT_DIR, '.auction-cache');

const LIVE_URL = 'https://www.cricnepal.com/npl-auction-season-3-live';
const TRACKER_URL = 'https://www.cricnepal.com/auction/npl-auction-season-3';
const USER_AGENT = 'Mozilla/5.0 (compatible; NPLAuctionSync/1.0; +https://nplcricketleague.com/auction)';

const TEAM_META = {
  'Lumbini Lions': { city: 'Lumbini', logo: '/images/teams/Lumbini-Lions.png' },
  'Sudurpaschim Royals': { city: 'Sudurpaschim', logo: '/images/teams/Sudurpaschim-Royals.png' },
  'Biratnagar Kings': { city: 'Biratnagar', logo: '/images/teams/Biratnagar-Kings.png' },
  'Kathmandu Gorkhas': { city: 'Kathmandu', logo: '/images/teams/Kathmandu-Gurkhas.png' },
  'Kathmandu Gurkhas': { city: 'Kathmandu', logo: '/images/teams/Kathmandu-Gurkhas.png', displayName: 'Kathmandu Gorkhas' },
  'Pokhara Avengers': { city: 'Pokhara', logo: '/images/teams/Pokhara-Avengers.png' },
  'Karnali Yaks': { city: 'Karnali', logo: '/images/teams/Karnali-Yaks.png' },
  'Chitwan Rhinos': { city: 'Chitwan', logo: '/images/teams/Chitwan-Rhinos.png' },
  'Janakpur Bolts': { city: 'Janakpur', logo: '/images/teams/Janakpur-Bolts.png' },
};

const TEAM_ORDER = [
  'Lumbini Lions',
  'Sudurpaschim Royals',
  'Biratnagar Kings',
  'Kathmandu Gorkhas',
  'Pokhara Avengers',
  'Karnali Yaks',
  'Chitwan Rhinos',
  'Janakpur Bolts',
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value) {
  return decodeEntities(String(value ?? ''))
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'auction-update';
}

function displayAmount(value) {
  if (value == null || value === '' || value === '-') return '-';
  return `${String(value).replace(/\.00$/, '')} lakh`;
}

function parseDisplayTime(value) {
  const match = String(value).match(/^(\d{1,2})\s+([A-Za-z]{3}),\s+(\d{1,2}):(\d{2})\s+(am|pm)$/i);
  if (!match) return '';
  const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  let hour = Number(match[3]);
  if (match[5].toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (match[5].toLowerCase() === 'am' && hour === 12) hour = 0;
  return `2026-${months[match[2]] || '07'}-${String(match[1]).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${match[4]}:00+05:45`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`Fetch failed for ${url}: ${response.status}`);
  return response.text();
}

function updateTag(title) {
  const text = title.toLowerCase();
  if (/\bunsold\b/.test(text) && /\bsold\b/.test(text)) return 'Mixed update';
  if (text.includes('unsold')) return 'Unsold';
  if (text.includes('sold') || text.includes(' to ')) return text.includes('category') ? 'Category update' : 'Sold';
  if (text.includes('break')) return 'Break';
  if (text.includes('arriv')) return 'Team arrival';
  if (text.includes('auction')) return 'Auction live';
  if (text.includes('category')) return 'Category A';
  return 'Live update';
}

function updateSummary(title) {
  if (/\bunsold\b/i.test(title) && /\bsold\b/i.test(title)) return `${title}.`;
  if (/unsold/i.test(title)) return `${title} in the latest NPL Auction Season 3 round.`;
  if (/sold| to /i.test(title)) return `${title} in the latest NPL Auction Season 3 update.`;
  return `${title}.`;
}

function parseTimeline(html) {
  const asideMatch = html.match(/<aside[^>]+aria-label="Timeline"[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/i);
  const source = asideMatch ? asideMatch[1] : html;
  const updates = [];
  const seen = new Set();
  const itemPattern = /<li>\s*<button[\s\S]*?<span[^>]*text-muted[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*text-body[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/button>\s*<\/li>/gi;
  let match;
  while ((match = itemPattern.exec(source))) {
    const displayTime = stripTags(match[1]);
    const title = stripTags(match[2]);
    if (!displayTime || !title) continue;
    const key = `${displayTime}|${title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    updates.push({
      id: slugify(`${displayTime}-${title}`),
      title,
      displayTime,
      isoTime: parseDisplayTime(displayTime),
      tag: updateTag(title),
      summary: updateSummary(title),
    });
  }
  if (!updates.length) throw new Error('No live timeline updates found');
  return updates;
}

function parseTeamCards(html) {
  const sectionMatch = html.match(/<section[^>]+aria-label="Team purses"[\s\S]*?<\/section>/i);
  if (!sectionMatch) throw new Error('Team purse section not found');
  const section = sectionMatch[0];
  const cardPattern = /<div class="rounded-lg border border-border-subtle bg-surface p-4">([\s\S]*?)(?=<div class="rounded-lg border border-border-subtle bg-surface p-4">|<\/section>)/g;
  const teams = [];
  let match;
  while ((match = cardPattern.exec(section))) {
    const card = match[1];
    const altMatch = card.match(/<img[^>]+alt="([^"]+)"/i);
    const clean = stripTags(card);
    const squadMatch = clean.match(/Squad\s+(\d+)\s*\/\s*16/i);
    const moneyMatch = clean.match(/Spent\s+([\d.]+)\s+lakh\s+Left\s+([\d.]+)\s+lakh/i);
    if (!altMatch || !squadMatch || !moneyMatch) continue;
    const sourceName = decodeEntities(altMatch[1]);
    const meta = TEAM_META[sourceName] || {};
    teams.push({
      name: meta.displayName || sourceName,
      city: meta.city || sourceName.split(' ')[0],
      logo: meta.logo || '',
      squad: Number(squadMatch[1]),
      spent: moneyMatch[1],
      left: moneyMatch[2],
    });
  }
  if (!teams.length) throw new Error('No team purse cards found');
  return TEAM_ORDER
    .map((name) => teams.find((team) => team.name === name))
    .filter(Boolean);
}

function parsePlayerRows(html) {
  const rows = [];
  const rowPattern = /<li class="cn-data-table__row">([\s\S]*?)<\/li>/g;
  let match;
  while ((match = rowPattern.exec(html))) {
    const row = match[1];
    const playerMatch = row.match(/cn-data-table__cell--link[^>]+title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!playerMatch) continue;
    const roleMatch = row.match(/cn-col--lg hidden md:flex">([\s\S]*?)<\/span>/i);
    const catMatch = row.match(/cn-col--sm[^>]*hidden sm:flex">([\s\S]*?)<\/span>/i);
    const nums = [...row.matchAll(/cn-col--md cn-data-table__cell--num">([\s\S]*?)<\/span>/g)].map((item) => stripTags(item[1]));
    const statusMatch = row.match(/inline-flex[^>]*>([\s\S]*?)<\/span>\s*<\/span>/i);
    const teamMatch = row.match(/href="https:\/\/www\.cricnepal\.com\/team\/[^"]+"[^>]+title="([^"]+)"/i);
    rows.push({
      player: decodeEntities(playerMatch[1]),
      role: stripTags(roleMatch?.[1] || '-'),
      category: stripTags(catMatch?.[1] || '-'),
      base: nums[0] || '-',
      price: nums[1] || '-',
      status: stripTags(statusMatch?.[1] || ''),
      team: teamMatch ? normalizeTeam(decodeEntities(teamMatch[1])) : '-',
    });
  }
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.player}|${row.status}|${row.team}|${row.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return row.status;
  });
}

function normalizeTeam(name) {
  const aliases = {
    Bolts: 'Janakpur Bolts',
    Janakpur: 'Janakpur Bolts',
    Kings: 'Biratnagar Kings',
    Biratnagar: 'Biratnagar Kings',
    Rhinos: 'Chitwan Rhinos',
    Chitwan: 'Chitwan Rhinos',
    Royals: 'Sudurpaschim Royals',
    Sudurpaschim: 'Sudurpaschim Royals',
    Gorkhas: 'Kathmandu Gorkhas',
    Gurkhas: 'Kathmandu Gorkhas',
    Kathmandu: 'Kathmandu Gorkhas',
    Yaks: 'Karnali Yaks',
    Karnali: 'Karnali Yaks',
    Pokhara: 'Pokhara Avengers',
    Avengers: 'Pokhara Avengers',
    'Sudurpashim Royals': 'Sudurpaschim Royals',
    Lumbini: 'Lumbini Lions',
  };
  if (aliases[name]) return aliases[name];
  if (name === 'Kathmandu Gurkhas') return 'Kathmandu Gorkhas';
  return name;
}

function cleanPlayerName(name) {
  return String(name || '')
    .replace(/^Category\s*\([A-Z]\):?\s*/i, '')
    .replace(/^(and|while)\s+/i, '')
    .trim();
}

function parseRowsFromTimeline(updates) {
  const rows = [];
  const pushRow = (player, status, team = '-', price = '-', category = '-') => {
    player = cleanPlayerName(player);
    // Reject commentary, counts and mixed clauses instead of turning them into players.
    if (!/^[A-Za-z][A-Za-z .'-]{2,}$/.test(player) || /\b(sold|unsold|players|went|goes|teams)\b/i.test(player)) return;
    const normalizedTeam = team === '-' ? '-' : normalizeTeam(team.trim());
    if (status === 'Sold' && !TEAM_ORDER.includes(normalizedTeam)) return;
    rows.push({ player, role: '-', category, base: '-', price, status, team: normalizedTeam });
  };

  for (const update of updates) {
    const category = update.title.match(/^Category\s*\(([A-Z])\)/i)?.[1] || '-';
    const title = update.title.replace(/^Category\s*\([A-Z]\):?\s*/i, '')
      .replace(/^The Big fish!\s*/i, '')
      .replace(/, two team neck and neck, /i, ' ').trim();
    // A list ending in "went/goes unsold" applies to each named player, not numeric totals.
    if (!/\bsold\b/i.test(title) && /\b(?:(?:went|goes)\s+)?unsold$/i.test(title)) {
      title.replace(/\s+(?:(?:went|goes)\s+)?unsold$/i, '').split(',')
        .forEach(name => pushRow(name.trim(), 'Unsold', '-', '-', category));
      continue;
    }
    const clauses = title.split(/,\s*(?=[A-Za-z][A-Za-z .'-]+?\s+(?:sold|unsold)\b)/);
    for (const clause of clauses) {
      let match = clause.match(/^(.+?) sold for ([\d.]+) lakhs? to (.+)$/i);
      if (match) {
        pushRow(match[1], 'Sold', match[3], match[2], category);
        continue;
      }
      match = clause.match(/^(.+?) (?:sold to|goes to|to) (.+?)(?:(?:,|\s+-|\s+for)\s*(?:NPR\s*)?([\d.]+)(?:\s+lakhs?(?:\s+rupees)?)?)?$/i);
      if (match) {
        pushRow(match[1], 'Sold', match[2], match[3] || '-', category);
        continue;
      }
      match = clause.match(/^(.+?) sold for (.+)$/i);
      if (match) {
        pushRow(match[1], 'Sold', match[2], '-', category);
        continue;
      }
      match = clause.match(/^(.+?) unsold$/i);
      if (match) pushRow(match[1], 'Unsold', '-', '-', category);
    }
  }
  return rows;
}

function mergeRows(primaryRows, timelineRows) {
  const merged = new Map();
  const keyFor = row => row.player.toLowerCase();
  // Timeline is newest first: a resale must supersede an earlier unsold round.
  for (const row of timelineRows) {
    if (!merged.has(keyFor(row))) merged.set(keyFor(row), row);
  }
  for (const row of primaryRows) {
    const key = keyFor(row);
    const existing = merged.get(key);
    if (existing && existing.status !== row.status) continue;
    const sameTeam = !existing || row.team === '-' || existing.team === '-' || row.team === existing.team;
    merged.set(key, {
      ...existing,
      ...row,
      price: row.price !== '-' ? row.price : (sameTeam ? existing?.price : null) || '-',
      team: row.team !== '-' ? row.team : existing?.team || '-',
    });
  }
  return [...merged.values()];
}

function parseCounts(html, rows) {
  const clean = stripTags(html);
  const match = clean.match(/Players\s+(\d+)\s+sold\s+·\s+(\d+)\s+unsold\s+·\s+(\d+)\s+in auction/i);
  if (match) {
    return {
      sold: Number(match[1]),
      unsold: Number(match[2]),
      total: Number(match[3]),
    };
  }
  throw new Error('Auction totals missing from source; refusing to publish inferred counts');
}

function latestUpdateTime(updates) {
  return updates[0]?.displayTime || 'Latest update';
}

function latestIsoTime(updates) {
  return updates[0]?.isoTime || '';
}

function buildFeed(updates) {
  return {
    status: 'Auction snapshot',
    orderLabel: `Timeline - ${updates.length} updates - Newest first`,
    updatedAt: latestIsoTime(updates),
    updatedAtLabel: latestUpdateTime(updates),
    updates,
  };
}

// Extraction only: the public tracker and timeline disagree. Never promote
// either source to the reviewed roster or overwrite generated page templates.
async function run() {
  const [liveHtml, trackerHtml] = await Promise.all([
    fetchText(LIVE_URL), fetchText(TRACKER_URL),
  ]);
  const updates = parseTimeline(liveHtml);
  const counts = parseCounts(trackerHtml);
  const candidate = {
    fetchedAt: new Date().toISOString(),
    sources: { timeline: LIVE_URL, tracker: TRACKER_URL },
    counts, feed: buildFeed(updates),
    publicationStatus: 'Research only; reconcile against reviewed season and auction data before publishing',
  };
  fs.mkdirSync(RESEARCH_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESEARCH_DIR, 'tracker.html'), trackerHtml);
  fs.writeFileSync(path.join(RESEARCH_DIR, 'timeline.html'), liveHtml);
  fs.writeFileSync(path.join(RESEARCH_DIR, 'candidate.json'), JSON.stringify(candidate, null, 2) + '\n');
  console.log(`Saved auction research to .auction-cache (${counts.total} tracker records). No public files changed.`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = {
  parseTimeline,
  parseTeamCards,
  parsePlayerRows,
  parseCounts,
  parseRowsFromTimeline,
  mergeRows,
  displayAmount,
  buildFeed,
};
