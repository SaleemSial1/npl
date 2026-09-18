const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const urls=new Set();
for(const dir of ['', 'teams','players','news'])for(const file of fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(path.join(root,dir,file),'utf8');
 if(/<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)[^>]*>/i.test(html))continue;
 const canonical=html.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)?.[1];
 if(canonical)urls.add(canonical.replace(/\.html$/,''));
}
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map(url=>`  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Sitemap: ${urls.size} indexable canonical URLs`);
