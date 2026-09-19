const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const season = require('../data/season-2026.json');
const auction = require('../data/auction-snapshot.json');
const read = file => fs.readFileSync(path.join(root,file),'utf8');

test('roster records have unique identities, valid teams and traceable sources', () => {
  assert.equal(new Set(season.players.map(p=>p.slug)).size,season.players.length);
  for(const p of season.players) {
    if(p.aliasOf) assert.ok(season.players.some(q=>q.slug===p.aliasOf && !q.aliasOf),p.slug);
    if(!p.team) continue;
    assert.ok(season.teams.some(t=>t.slug===p.team),p.slug);
    assert.ok(p.sources.length,p.slug);
    for(const id of p.sources) assert.ok(URL.canParse(season.sources[id]),`${p.slug}: ${id}`);
    assert.ok(fs.existsSync(path.join(root,'players',p.slug+'.html')),p.slug);
  }
});

test('auction prices reconcile to each team purse and roster record', () => {
  const sold=auction.players.filter(p=>p.status==='sold');
  assert.equal(sold.length,53);
  assert.equal(auction.players.filter(p=>p.status==='unsold').length,102);
  for(const t of season.teams) {
    assert.equal(sold.filter(p=>p.team===t.name).reduce((sum,p)=>sum+p.priceLakh,0),t.auctionSpendLakh,t.name);
  }
  for(const p of sold) {
    const records=season.players.filter(q=>(p.sourceProfile ? q.sourceProfile===p.sourceProfile : q.name===p.name) && q.team && !q.aliasOf);
    assert.equal(records.length,1,p.name);
    assert.equal(records[0].priceLakh,p.priceLakh,p.name);
    assert.equal(season.teams.find(t=>t.slug===records[0].team).name,p.team,p.name);
  }
});

test('custom schedule survives generation and unavailable statistics stay explicit', () => {
  assert.equal(read('schedule.html'),read('templates/season/schedule.html'));
  assert.match(read('stats.html'),/Not available before the first match/);
  assert.match(read('points-table.html'),/alphabetically, not ranked/);
});

test('every HTML internal destination and asset exists', () => {
  const pages=['','teams','players','news'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html')).map(f=>path.posix.join(dir,f)));
  for(const file of pages) {
    for(const [,raw] of read(file).matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      if(/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(raw))continue;
      const url=new URL(raw,'https://nplcricketleague.com/'+file);
      let target=decodeURIComponent(url.pathname).replace(/^\//,'') || 'index.html';
      if(!path.extname(target))target+='.html';
      assert.ok(fs.existsSync(path.join(root,target)),`${file} → ${raw}`);
      if(url.hash && target.endsWith('.html')) {
        const anchor=decodeURIComponent(url.hash.slice(1));
        assert.ok(read(target).includes(`id="${anchor}"`) || read(target).includes(`id='${anchor}'`),`${file} → ${raw}`);
      }
    }
  }
});
