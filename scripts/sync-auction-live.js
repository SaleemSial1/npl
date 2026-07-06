const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const AUCTION_HTML = path.join(ROOT_DIR, 'auction.html');
const LIVE_FEED_JSON = path.join(ROOT_DIR, 'data', 'npl-auction-live.json');

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
  if (value == null || value === '') return '-';
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
  if (text.includes('unsold') && text.includes('sold')) return 'Mixed update';
  if (text.includes('unsold')) return 'Unsold';
  if (text.includes('sold') || text.includes(' to ')) return text.includes('category') ? 'Category update' : 'Sold';
  if (text.includes('break')) return 'Break';
  if (text.includes('arriv')) return 'Team arrival';
  if (text.includes('auction')) return 'Auction live';
  if (text.includes('category')) return 'Category A';
  return 'Live update';
}

function updateSummary(title) {
  if (/unsold/i.test(title) && /sold/i.test(title)) return `${title}.`;
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
  const pushRow = (row) => {
    const player = cleanPlayerName(row.player);
    if (!player || player.length < 3) return;
    rows.push({
      player,
      role: '-',
      category: row.category || '-',
      base: '-',
      price: row.price || '-',
      status: row.status,
      team: row.team ? normalizeTeam(row.team.trim()) : '-',
    });
  };

  for (const update of updates) {
    const title = update.title;

    let match = title.match(/^(.+?) sold for ([\d.]+) lakh to (.+)$/i);
    if (match) {
      pushRow({ player: match[1], price: match[2], team: match[3], status: 'Sold' });
      continue;
    }

    match = title.match(/^(.+?) sold to (.+?)(?:,|\s+-)\s*(?:NPR\s*)?([\d.]+)(?:\s*lakh)?$/i);
    if (match) {
      pushRow({ player: match[1], team: match[2], price: match[3], status: 'Sold' });
      continue;
    }

    match = title.match(/^(.+?) to (.+?),\s*([\d.]+)\s*lakh$/i);
    if (match) {
      pushRow({ player: match[1], team: match[2], price: match[3], status: 'Sold' });
      continue;
    }

    match = title.match(/^(.+?) sold for (.+)$/i);
    if (match && /royals|bolts|kings|rhinos|yaks|gorkhas|gurkhas|pokhara|lumbini/i.test(match[2])) {
      pushRow({ player: match[1], team: match[2], price: '2', status: 'Sold' });
      continue;
    }

    const soldPattern = /(?:^|,\s*)([A-Z][A-Za-z .]+?) sold to ([A-Za-z ]+?)(?:,|\s+-|$)\s*(?:NPR\s*)?([\d.]+)?/gi;
    while ((match = soldPattern.exec(title))) {
      pushRow({ player: match[1], team: match[2], price: match[3] || '-', status: 'Sold' });
    }

    if (/went unsold/i.test(title)) {
      const names = title.replace(/went unsold.*/i, '').split(',');
      names.forEach((name) => pushRow({ player: name, status: 'Unsold' }));
    }

    const unsoldPattern = /(?:^|,\s*)([A-Z][A-Za-z .]+?) unsold/gi;
    while ((match = unsoldPattern.exec(title))) {
      pushRow({ player: match[1], status: 'Unsold' });
    }
  }

  return rows;
}

function mergeRows(primaryRows, timelineRows) {
  const merged = new Map();
  const keyFor = (row) => `${row.player.toLowerCase()}|${row.status}`;
  for (const row of timelineRows) {
    merged.set(keyFor(row), row);
  }
  for (const row of primaryRows) {
    const key = keyFor(row);
    const existing = merged.get(key);
    merged.set(key, {
      ...existing,
      ...row,
      price: row.price !== '-' ? row.price : existing?.price || '-',
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
  return {
    sold: rows.filter((row) => row.status === 'Sold').length,
    unsold: rows.filter((row) => row.status === 'Unsold').length,
    total: 155,
  };
}

function latestUpdateTime(updates) {
  return updates[0]?.displayTime || 'Latest update';
}

function latestIsoTime(updates) {
  return updates[0]?.isoTime || '';
}

function buildFeed(updates) {
  return {
    status: 'Live auction updates',
    orderLabel: `Timeline - ${updates.length} updates - Newest first`,
    updatedAt: latestIsoTime(updates),
    updatedAtLabel: latestUpdateTime(updates),
    updates,
  };
}

function rowHtml(cells) {
  return `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
}

function renderTeamCards(teams) {
  return teams.map((team) => {
    const progress = Math.min(100, Math.round((team.squad / 16) * 10000) / 100);
    return `<article class="tracker-card">
<div class="tracker-card__top">
<img alt="${escapeHtml(team.name)} logo" class="tracker-card__logo" src="${escapeHtml(team.logo)}"/>
<div><span class="tracker-card__city">${escapeHtml(team.city)}</span><span class="tracker-card__name">${escapeHtml(team.name)}</span></div>
</div>
<div class="squad-progress"><div class="squad-progress__label"><span>Squad</span><span>${team.squad} / 16</span></div><div class="progress-track"><div class="progress-fill" style="width: ${progress}%;"></div></div></div>
<div class="purse-row"><div class="purse-box"><span class="purse-label">Spent</span><strong class="purse-value">${escapeHtml(displayAmount(team.spent))}</strong></div><div class="purse-box"><span class="purse-label">Left</span><strong class="purse-value">${escapeHtml(displayAmount(team.left))}</strong></div></div>
</article>`;
  }).join('\n');
}

function teamBuys(teamName, soldRows) {
  return soldRows
    .filter((row) => row.team === teamName)
    .map((row) => row.player)
    .join(', ') || 'Awaiting update';
}

function compactSoldRows(soldRows) {
  return soldRows.slice(0, 10).map((row) => rowHtml([
    row.player,
    row.team,
    displayAmount(row.price),
    row.status,
  ])).join('\n');
}

function compactUnsoldRows(unsoldRows, counts) {
  const visible = unsoldRows.slice(0, 8).map((row) => rowHtml([
    row.player,
    row.category,
    row.status,
    'Listed on auction tracker',
  ]));
  visible.push(rowHtml(['Tracker total', '-', `${counts.unsold} unsold`, 'Synced from auction tracker']));
  return visible.join('\n');
}

function resultUnsoldRows(unsoldRows, counts) {
  const visible = unsoldRows.map((row) => rowHtml([
    row.player,
    row.category,
    row.role,
    'Live tracker',
    row.status,
  ]));
  visible.push(rowHtml(['Tracker total', '-', '-', 'Latest snapshot', `${counts.unsold} unsold listed`]));
  return visible.join('\n');
}

function replaceOrThrow(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Could not update ${label}`);
  return html.replace(pattern, replacement);
}

function updateAuctionHtml({ teams, rows, counts, feed }) {
  let html = fs.readFileSync(AUCTION_HTML, 'utf8');
  const soldRows = rows.filter((row) => row.status === 'Sold');
  const unsoldRows = rows.filter((row) => row.status === 'Unsold');
  const topBuys = [...soldRows]
    .filter((row) => Number(row.price) > 0)
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 10);
  const latestTitle = feed.updates[0]?.title || 'Auction update';
  const latestTime = feed.updatedAtLabel;

  html = html.replace(/<span class="status-pill">[\s\S]*?<\/span>/, '<span class="status-pill">Auction live</span>');
  html = html.replace(/"eventStatus": "https:\/\/schema\.org\/[^"]+"/, '"eventStatus": "https://schema.org/EventInProgress"');
  html = html.replace(/<li><span>Status:<\/span>[\s\S]*?<\/li>/, '<li><span>Status:</span> Auction live</li>');

  html = replaceOrThrow(
    html,
    /<p class="section-note">(Latest synced snapshot from auction day:|Auto-synced latest snapshot:)[\s\S]*?<\/p>/,
    `<p class="section-note">Auto-synced latest snapshot: ${counts.sold} sold, ${counts.unsold} unsold and ${counts.total} players in the NPL Season 3 auction pool.</p>`,
    'team purse note',
  );

  html = replaceOrThrow(
    html,
    /<div class="team-grid">[\s\S]*?<\/article>\n<\/div>\n<p class="source-note">[\s\S]*?<\/p>/,
    `<div class="team-grid">\n${renderTeamCards(teams)}\n</div>\n<p class="source-note">Purse and player-pool figures are auto-synced from the auction tracker. Latest timeline update: ${escapeHtml(latestTitle)} (${escapeHtml(latestTime)}).</p>`,
    'team grid',
  );

  html = replaceOrThrow(
    html,
    /<p class="section-note">Latest snapshot:[\s\S]*?<\/p>/,
    `<p class="section-note">Latest snapshot: ${counts.sold} sold players, ${counts.unsold} unsold listed on the auction tracker, and ${counts.total} players in the Season 3 auction pool.</p>`,
    'player board note',
  );

  html = replaceOrThrow(
    html,
    /(<div class="tab-panel is-active" id="top-buys">[\s\S]*?<tbody>\n)[\s\S]*?(\n<\/tbody>)/,
    `$1${topBuys.map((row) => rowHtml([row.player, row.team, displayAmount(row.price), row.status])).join('\n')}$2`,
    'top buys tab',
  );
  html = replaceOrThrow(
    html,
    /(<div class="tab-panel" id="sold">[\s\S]*?<tbody>\n)[\s\S]*?(\n<\/tbody>)/,
    `$1${compactSoldRows(soldRows)}$2`,
    'sold tab',
  );
  html = replaceOrThrow(
    html,
    /(<div class="tab-panel" id="unsold">[\s\S]*?<tbody>\n)[\s\S]*?(\n<\/tbody>)/,
    `$1${compactUnsoldRows(unsoldRows, counts)}$2`,
    'unsold tab',
  );
  html = replaceOrThrow(
    html,
    /<tr><td>Season 3 auction pool<\/td><td>155<\/td><td>[\s\S]*?<\/td><td>[\s\S]*?<\/td><\/tr>/,
    rowHtml(['Season 3 auction pool', counts.total, 'Live bidding', `${counts.sold} sold, ${counts.unsold} unsold listed`]),
    'all players row',
  );

  html = replaceOrThrow(
    html,
    /<p class="section-note">Confirmed sold players,[\s\S]*?<\/p>/,
    `<p class="section-note">Confirmed sold players, winning franchises and auction prices from the auto-synced NPL Season 3 live auction tracker.</p>`,
    'sold section note',
  );
  html = replaceOrThrow(
    html,
    /<p class="result-summary">The Season 3 auction is tracking[\s\S]*?<\/p>/,
    `<p class="result-summary">The Season 3 auction is tracking a ${counts.total}-player shortlist from the wider 347-player registration pool. This table is auto-synced from the auction tracker.</p>`,
    'sold section summary',
  );
  html = replaceOrThrow(
    html,
    /(<section class="result-section" id="players-sold"[\s\S]*?<tbody>\n)[\s\S]*?(\n<\/tbody>)/,
    `$1${soldRows.map((row) => rowHtml([row.player, row.team, displayAmount(row.price), row.status, 'Live tracker'])).join('\n')}$2`,
    'sold section table',
  );
  html = replaceOrThrow(
    html,
    /<p class="result-note">(Latest sold update tracked:|Latest live update:)[\s\S]*?<\/p>/,
    `<p class="result-note">Latest live update: ${escapeHtml(latestTitle)} (${escapeHtml(latestTime)}).</p>`,
    'sold latest note',
  );

  html = replaceOrThrow(
    html,
    /<p class="result-summary">The live auction tracker (lists|currently lists)[\s\S]*?<\/p>/,
    `<p class="result-summary">The live auction tracker currently lists ${counts.unsold} unsold players. Names below are auto-synced from the public auction table.</p>`,
    'unsold summary',
  );
  html = replaceOrThrow(
    html,
    /(<section class="result-section" id="unsold-list"[\s\S]*?<tbody>\n)[\s\S]*?(\n<\/tbody>)/,
    `$1${resultUnsoldRows(unsoldRows, counts)}$2`,
    'unsold table',
  );

  html = replaceOrThrow(
    html,
    /<p class="result-summary">All eight franchises (are being updated|are auto-synced)[\s\S]*?<\/p>/,
    `<p class="result-summary">All eight franchises are auto-synced with current auction buys, spending and remaining purse from the tracker.</p>`,
    'team squad summary',
  );
  html = replaceOrThrow(
    html,
    /(<section class="result-section" id="team-squads"[\s\S]*?<tbody>\n)[\s\S]*?(\n<\/tbody>)/,
    `$1${teams.map((team) => rowHtml([
      team.name,
      `${team.squad} / 16`,
      teamBuys(team.name, soldRows),
      displayAmount(team.left),
      'Auto-synced',
    ])).join('\n')}$2`,
    'team squad table',
  );

  fs.writeFileSync(AUCTION_HTML, html);
}

async function run() {
  const [liveHtml, trackerHtml] = await Promise.all([
    fetchText(LIVE_URL),
    fetchText(TRACKER_URL),
  ]);
  const updates = parseTimeline(liveHtml);
  const teams = parseTeamCards(trackerHtml);
  const rows = mergeRows(parsePlayerRows(trackerHtml), parseRowsFromTimeline(updates));
  const counts = parseCounts(trackerHtml, rows);
  const feed = buildFeed(updates);

  fs.writeFileSync(LIVE_FEED_JSON, `${JSON.stringify(feed, null, 2)}\n`);
  updateAuctionHtml({ teams, rows, counts, feed });

  console.log(`Synced ${updates.length} timeline updates, ${counts.sold} sold, ${counts.unsold} unsold, ${teams.length} teams`);
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
};
