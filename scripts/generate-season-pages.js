const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const season = require('../data/season-2026.json');
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const write = (file,text) => fs.writeFileSync(path.join(root,file),text);
const header = read('templates/site-header.html');
const footer = read('templates/site-footer.html');
const checked = '18 September 2026';
const windowText = 'October 26–November 21, 2026';
const teamFor = p => season.teams.find(t => t.slug === p.team);
const active = season.players.filter(p => p.team && !p.aliasOf);
const link = (url,label) => `<a href="${esc(url)}">${esc(label)}</a>`;
const section = (title,body) => `<section class="season-panel"><h2>${esc(title)}</h2>${body}</section>`;
const sources = ids => section('Sources and verification',`<p>Checked ${checked}. Records describe the dated reports linked here; a signing does not guarantee selection or availability for every match.</p><ul>${[...new Set(ids)].map(id=>`<li>${link(season.sources[id],id.replaceAll('-',' ')+' — '+new URL(season.sources[id]).hostname)}</li>`).join('')}</ul>`);
const note = text => `<p class="season-notice">${esc(text)}</p>`;
const table = (head,rows,caption) => `<div class="season-table-wrap" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${head.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function shell(file,title,description,body,{noindex=false,entity=null,canonical=null}={}) {
 const url=canonical || `https://nplcricketleague.com/${file.replace(/\.html$/,'')}`;
 const schema={'@context':'https://schema.org','@type':'WebPage',name:title,url,description,...(entity?{mainEntity:entity}:{})};
 write(file,`<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"><meta name="robots" content="${noindex?'noindex, follow':'index, follow'}"><link rel="canonical" href="${esc(url)}"><link rel="icon" href="/NPL Logo.png" type="image/png">
<meta name="google-site-verification" content="FcI0XnWsjvW-He8lPMA0I-pgbndhVjvFJDxlKS7I6uI"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:type" content="website"><meta property="og:image" content="https://nplcricketleague.com/images/NPL.webp"><meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/season.css"><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-WXJZYNV100"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-WXJZYNV100');</script>
</head><body>${header}<main class="season-main" id="main"><div class="container"><nav class="season-breadcrumb" aria-label="Breadcrumb">${link('/','Home')} / ${link('/teams','Teams')} / ${link('/players','Players')} / ${link('/stats','Stats')}</nav>${body}</div></main>${footer}<script src="/scripts/season-ui.js" defer></script><script src="/scripts/cookie-consent.js"></script><script src="/scripts/site-search.js" defer></script></body></html>\n`);
}
const hero = (title,desc) => `<div class="season-hero"><p class="season-eyebrow">Nepal Premier League · Season 3</p><h1>${esc(title)}</h1><p>${esc(desc)}</p><p class="season-date">Season window: ${windowText} · Reviewed ${checked}</p></div>`;
function rosterTable(players,caption) {
 return table(['Player','Team','Listing','Role','Auction price'],players.map(p=>[link('/players/'+p.slug,p.name),link('/teams/'+p.team,teamFor(p).name),esc(p.status),esc(p.role||'Not specified in cited report'),p.priceLakh==null?'—':`NPR ${esc(p.priceLakh)} lakh`]),caption);
}
function generate() {
 for (const t of season.teams) {
  const ps=active.filter(p=>p.team===t.slug);
  const intro=`${t.name} Season 3 squad tracker: reported retentions, auction listings and verified overseas signings. This is a dated roster snapshot, not a final playing XI.`;
  const body=hero(t.name+' — NPL 2026 Squad',intro)+
   section('Season 3 team status',`<p>${esc(t.note)} The tournament window is ${windowText}. Individual fixtures and starting XIs are not verified in this snapshot.</p>${t.captain?`<p><strong>Captain:</strong> ${esc(t.captain)}.</p>`:''}${t.coach?`<p><strong>Head coach:</strong> ${esc(t.coach)}.</p>`:''}<p>${ps.length} listed players: ${ps.filter(p=>p.status==='Retained').length} retained, ${ps.filter(p=>p.status.includes('auction')||p.status==='Auction listing').length} auction records and ${ps.filter(p=>p.status==='Overseas signing').length} overseas signings.</p><p>${link('/schedule','Season 3 schedule status')} · ${link('/points-table','Pre-season points table')}</p>`)+
   section('Retained players',rosterTable(ps.filter(p=>p.status==='Retained'),t.name+' retained players'))+
   section('Auction listings',note(season.notes[0])+rosterTable(ps.filter(p=>p.status==='Auction listing'||p.status==='Conflicting auction reports'),t.name+' auction records')+`<p>Tracker purse snapshot: NPR ${t.auctionSpendLakh} lakh spent; NPR ${t.remainingPurseLakh} lakh left. These are reported auction figures, not overseas contract values.</p>`)+
   section('Overseas signings',ps.some(p=>p.status==='Overseas signing')?rosterTable(ps.filter(p=>p.status==='Overseas signing'),t.name+' overseas signings'):'<p>No overseas signing has been verified for this team in this snapshot. This does not mean the team has made none.</p>')+
   section('Season 3 statistics','<p>The 2026 tournament has not started as of this review. Runs, wickets, averages and win rates will need verified scorecards after matches begin.</p>')+
   sources([...t.sources,...ps.flatMap(p=>p.sources),...(t.coach?['pokhara-coach']:[]),'dates']);
  if (fs.existsSync(`teams/${t.slug}.html`) && fs.readFileSync(`teams/${t.slug}.html`, "utf8").includes("team-hero")) { continue; }
  shell(`teams/${t.slug}.html`,`${t.name} NPL 2026 Squad & Player Status`,intro,body,{entity:{'@type':'SportsTeam',name:t.name,sport:'Cricket'}});
 }
 for (const p of season.players) {
  const targetFile = path.join(root, `players/${p.slug}.html`);
  if (fs.existsSync(targetFile) && fs.readFileSync(targetFile, 'utf8').includes('profile-header')) {
    continue;
  }
  const t=teamFor(p), disputed=p.status==='Conflicting auction reports';
  const description=t?`${p.name}: ${p.status.toLowerCase()} for ${t.name} in the NPL Season 3 source snapshot. Review the source date, squad status and match-stat availability.`:`${p.name} player archive. A current NPL 2026 team or contract has not been verified in this site's source snapshot.`;
  let body=hero(p.name,description);
  if(p.aliasOf) body+=section('Player profile',`<p>This spelling refers to ${link('/players/'+p.aliasOf,season.players.find(x=>x.slug===p.aliasOf).name)}. Use the linked profile for the maintained squad record.</p>`);
  else {
   body+=section('NPL 2026 squad status',table(['Field','Detail'],[
    ['Player',esc(p.name)],['Team',t?link('/teams/'+t.slug,t.name):'Not verified for Season 3'],['Listing',esc(p.status)],['Playing role',esc(p.role||'Not specified in the cited roster report')],['Auction price',p.priceLakh==null?'Not published in this record':`NPR ${p.priceLakh} lakh${disputed?' — disputed sale status':''}`],['Source review',checked]
   ],p.name+' profile summary'));
   if(p.note)body+=note(p.note);
   if(p.slug==='rashid-khan')body+=note('This is the Nepal domestic player listed in Kathmandu’s retained core. Do not confuse this record with Afghanistan’s international leg-spinner of the same name.');
   body+=section('Performance statistics',`<p>NPL Season 3 is scheduled for ${windowText}. No completed 2026 NPL batting or bowling record is available before the tournament starts.</p><p>Earlier unsourced career totals and season figures have been withdrawn. International, domestic and NPL statistics require separate, dated scorecard records; missing values are not zero.</p>`);
   if(t)body+=section('Follow '+t.name,`<p>${link('/teams/'+t.slug,t.name+' squad')} lists each player’s recruitment status separately. Auction prices apply only to the listed auction transaction; they are not a career salary or a retained-player fee.</p><p>${link('/matches','Match centre')} · ${link('/stats','Season statistics status')} · ${link('/players','Player directory')}</p>`)+sources(p.sources);
   else body+=section('Archive status','<p>This URL is retained for existing links. It does not confirm a 2026 signing, captaincy, playing role or match availability. Browse the <a href="/players">current player directory</a> for source-linked squad records.</p>');
  }
  shell(`players/${p.slug}.html`,`${p.name} | NPL Player & Squad Status`,description,body,{noindex:!t||!!p.aliasOf,canonical:p.aliasOf?`https://nplcricketleague.com/players/${p.aliasOf}`:null,entity:{'@type':'Person',name:p.name,...(t&&!disputed?{memberOf:{'@type':'SportsTeam',name:t.name}}:{})}});
  if(p.aliasOf) {
   const file=`players/${p.slug}.html`;
   write(file,read(file).replace('</head>',`<meta http-equiv="refresh" content="0; url=/players/${p.aliasOf}"></head>`));
  }
 }
 const cards=season.teams.map(t=>`<article class="season-card"><img src="${esc(t.logo)}" alt="${esc(t.name)} logo" width="80" height="80" loading="lazy"><h2>${link('/teams/'+t.slug,t.name)}</h2><p>${esc(t.note||'Season 3 roster and recruitment status.')}</p><p>${active.filter(p=>p.team===t.slug).length} players in the reviewed source snapshot.</p></article>`).join('');
 shell('teams.html','NPL 2026 Teams & Squad Tracker','Explore all eight NPL teams, source-linked squad records and the distinction between retentions, auction listings and overseas signings.',hero('NPL 2026 Teams','Eight franchises. Source-linked rosters, with disputed and unverified details clearly labelled.')+`<div class="season-grid">${cards}</div>`+note(season.notes[2])+sources(['retentions','pokhara-retentions','auction','auction-report','dates']));
 const filter=`<div class="season-filters"><label for="rosterSearch">Find player<input id="rosterSearch" type="search" placeholder="Player name"></label><label for="teamFilter">Team<select id="teamFilter"><option value="all">All teams</option>${season.teams.map(t=>`<option value="${t.slug}">${esc(t.name)}</option>`).join('')}</select></label><label for="statusFilter">Listing<select id="statusFilter"><option value="all">All listings</option>${[...new Set(active.map(p=>p.status))].map(s=>`<option>${esc(s)}</option>`).join('')}</select></label></div><p id="rosterCount" role="status">${active.length} players listed</p>`;
 const playerCards=active.map(p=>`<article class="season-card roster-card" data-name="${esc(p.name.toLowerCase())}" data-team="${p.team}" data-status="${esc(p.status)}"><span class="season-chip">${esc(p.status)}</span><h2>${link('/players/'+p.slug,p.name)}</h2><p>${link('/teams/'+p.team,teamFor(p).name)}</p><p>${esc(p.role||'Role not specified')}</p>${p.priceLakh!=null?`<p>Listed auction price: NPR ${p.priceLakh} lakh</p>`:''}</article>`).join('');
 shell('players.html','NPL 2026 Players | Search Team Squads','Search the NPL Season 3 roster by player, team and recruitment status. Includes source-linked records and flagged auction conflicts.',hero('NPL 2026 Player Directory','Search retained players, reported auction buys and verified overseas signings. Counts reflect this reviewed directory, not an official final registration list.')+filter+`<div class="season-grid">${playerCards}</div><p id="rosterEmpty" hidden>No players match these filters.</p>`+section('Roster coverage',`<p>${esc(season.notes[0])}</p><p>${esc(season.notes[2])}</p><p>${link('/all-players','Compare rosters in one table')}</p>`));
 shell('all-players.html','NPL 2026 Squad Comparison | All Listed Players','Compare all reviewed Nepal Premier League squad records by team, recruitment status, role and published auction price.',hero('NPL 2026 Squad Comparison','Compare the same source records used by team pages and player profiles.')+note(season.notes[0])+rosterTable(active,'All reviewed Season 3 squad records')+sources(['retentions','pokhara-retentions','auction','auction-report']));
 shell('international-stars.html','NPL 2026 Overseas Signings | Verified Player Tracker','Verified overseas signings for NPL 2026, including David Warner, Charith Asalanka, Shakib Al Hasan, Sikandar Raza and Harmeet Singh.',hero('NPL 2026 Overseas Signings','Verified signings in the reviewed reports. Coverage is partial and does not establish a complete overseas roster or match availability.')+rosterTable(active.filter(p=>p.status==='Overseas signing'),'Verified overseas signings')+sources(active.filter(p=>p.status==='Overseas signing').flatMap(p=>p.sources)));
 const stats=hero('NPL 2026 Statistics','Season 3 has not started as of 18 September 2026. Historical figures must not be labelled as 2026 results.')+section('Batting and bowling',table(['Metric','Season 3 status'],[['Runs','Not available before the first match'],['Wickets','Not available before the first match'],['Batting average / strike rate','Not available'],['Bowling average / economy','Not available'],['Leading run-scorer / wicket-taker','Not established']],'2026 match statistics'))+section('How records will be published','<p>Statistics need a season, format, scorecard source and an update date. Squad membership alone does not count as a match played. Missing averages and rates stay unavailable rather than being displayed as zero.</p><p><a href="/points-table">Pre-season points table</a> · <a href="/players">Player directory</a></p>')+sources(['dates']);
 shell('stats.html','NPL 2026 Stats | Season 3 Statistics Status','NPL 2026 batting, bowling and leaderboard availability. No results or player totals are published before verified Season 3 matches.',stats);
 generateGuides();
 generateAuction();
 console.log(`Generated ${season.players.length} player profiles, 8 team pages and season guides`);
}
function generateAuction() {
 const snapshot=require('../data/auction-snapshot.json');
 const feed=require('../data/npl-auction-live.json');
 const sold=snapshot.players.filter(p=>p.status==='sold');
 const unsold=snapshot.players.filter(p=>p.status==='unsold');
 const board=rows=>table(['Player','Team','Category','Base (NPR lakh)','Price (NPR lakh)','Tracker status'],rows.map(p=>[esc(p.name),esc(p.team||'—'),esc(p.category),esc(p.baseLakh),p.priceLakh==null?'—':esc(p.priceLakh),esc(p.status)+(p.name==='Dilsad Ali'||p.name==='Sahil Patel'?' — timeline conflict':'')]),'Auction source records');
 const tabs=[['top-buys','Top buys',sold.slice().sort((a,b)=>b.priceLakh-a.priceLakh).slice(0,15)],['sold','Sold',sold],['unsold','Unsold',unsold],['all','All players',snapshot.players]];
 const body=hero('NPL Auction Season 3','Auction snapshot from July 6, 2026. Source records reviewed on 18 September 2026; conflicting totals and outcomes remain flagged.')+
 section('Source differences',note(season.notes[0])+note(season.notes[1])+`<p><strong>${sold.length} sold / ${unsold.length} unsold</strong> in the current tracker record. These are source counts, not reconciled official totals.</p>`)+
 section('Player board',`<div class="season-tabs" role="tablist" aria-label="Auction players">${tabs.map(([id,label],i)=>`<button type="button" role="tab" id="tab-${id}" aria-controls="${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div>${tabs.map(([id,label,rows],i)=>`<div class="tab-panel" role="tabpanel" id="${id}" aria-labelledby="tab-${id}" ${i?'hidden':''}>${board(rows)}</div>`).join('')}`)+
 section('Team purse snapshot',table(['Team','Auction spend (NPR lakh)','Purse left (NPR lakh)'],season.teams.map(t=>[link('/teams/'+t.slug,t.name),esc(t.auctionSpendLakh),esc(t.remainingPurseLakh)]),'Reported auction purse figures')+'<p>Counts of auction purchases are not complete squad sizes. Retained and overseas players appear separately in the <a href="/teams">team directory</a>.</p>')+
 section('Auction-day timeline',`<p id="liveFeedStatus">Auction snapshot</p><p>Last source update: <time id="liveFeedUpdated" datetime="${feed.updatedAt}">6 July 2026, 10:30 pm Nepal time</time></p><details><summary>Read ${feed.updates.length} historical updates</summary><ol>${feed.updates.map(u=>`<li><time datetime="${esc(u.isoTime)}">${esc(u.displayTime)}</time> — ${esc(u.title)}</li>`).join('')}</ol></details>`)+sources(['auction','auction-day','auction-report']);
 shell('auction.html','NPL Auction 2026 | Source Records, Prices & Conflicts','Review Nepal Premier League Season 3 auction records, player prices and team purse figures with source discrepancies clearly marked.',body);
}
function generateGuides() {
 const guides=require('../data/season-guides.json');
 for(const g of guides) {
  const customTemplate=path.join(root,'templates','season',g.file);
  if(fs.existsSync(customTemplate)) { write(g.file,fs.readFileSync(customTemplate,'utf8')); continue; }
  shell(g.file,g.title,g.description,hero(g.heading,g.description)+g.sections.map(s=>section(s.title,s.html)).join('')+sources(g.sources||['dates']),{noindex:g.noindex||false});
 }
 const standings=season.teams.slice().sort((a,b)=>a.name.localeCompare(b.name));
 shell('points-table.html','NPL 2026 Points Table | Pre-season Standings','All eight NPL teams before the first Season 3 match. No rankings or net run rates have been established.',hero('NPL 2026 Points Table','Pre-season: teams are listed alphabetically, not ranked. No Season 3 matches have been played as of this review.')+table(['Team','Played','Won','Lost','No result','Points','NRR'],standings.map(t=>[link('/teams/'+t.slug,t.name),'0','0','0','0','0','—']),'Pre-season standings — not a ranking')+section('Standings availability','<p>Net run rate is unavailable until matches are played. Results, standings and qualification will be updated from verified scorecards after the tournament begins.</p><p><a href="/schedule">Schedule status</a> · <a href="/stats">Player statistics status</a></p>')+sources(['dates']));
}
if(require.main===module) generate();
module.exports={generate,generateAuction};
