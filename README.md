# NPL static site

Static HTML/CSS/JavaScript site served by Apache with clean URLs configured in `.htaccess`. Node.js 22 or later is used for the build scripts and tests; no npm packages are required.

## Preview and validate

```sh
npm run build
npm run news:validate
npm test
npm run preview
```

Open `http://127.0.0.1:4173`. To use another port: `PORT=4187 npm run preview`. The local preview handles clean URLs for development; production HTTPS redirects and Apache rewrite behavior must be checked on the deployed host.

## Content and generated files

Read `AGENTS.md` before working on news. `data/news.json` is the news source of truth. `npm run news:generate` updates article pages, archive, homepage cards, and sitemaps. `npm run search:generate` rebuilds the title-based search index after page changes. `npm run build` regenerates season pages, news, search and the main sitemap.

`npm run news:fetch` only extracts research to `.news-cache`; it does not publish. `npm run auction:sync` saves raw auction sources and a research candidate in ignored `.auction-cache/`; it never changes published data or pages. Reconcile source disagreements before updating the reviewed JSON snapshots. Missing source totals stop extraction instead of guessing counts. Historical timeline entries do not establish that an auction is currently live.

The homepage uses committed 480px and 800px WebP derivatives under `images/news/responsive/` when available. Original images and their source metadata stay intact; new stories fall back to their original image until derivatives are prepared.

## Forms and search

The contact form prepares a `mailto:` draft. Users must review and send it in their email app. It does not send through a backend or promise successful delivery. Newsletter signup has been replaced with a news archive link because no subscription service is configured. Search uses local page titles and a generated JSON index; it sends no queries to a third-party service.

## Publishing

CI rebuilds generated files and fails on drift, then runs news validation and tests. Deploy the static site, including `.htaccess`, scripts, data and images, through the existing hosting workflow. Verify the public homepage, `/news`, `/teams`, `/players`, contact page and an article after deployment. A repository edit or successful local preview alone does not update the public website.

## Season data and custom designs

`data/season-2026.json` holds reviewed player/team records and provenance. `data/auction-snapshot.json` holds the complete dated tracker snapshot; disputed outcomes remain labelled. `data/season-guides.json` supplies the standard guides. Update source records before running `npm run season:generate`.

The custom schedule design is maintained in `templates/season/schedule.html` and copied to `schedule.html` by the build. Edit its template, not just the output. Custom team pages with `team-hero` and player pages with `profile-header` are currently maintained directly; their content requires a separate consistency review when shared roster data changes. Legacy Python profile generators are not part of the build and should not be used to overwrite reviewed profiles.
