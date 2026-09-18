# Live site audit and local improvements

Audit date: September 17, 2026. Public site: https://nplcricketleague.com/

## Live checks

Opened 19 distinct pages in the browser: homepage, matches, teams, players, news archive, schedule, points table, tickets, auction, venues, videos, fan guide, streaming, about, contact, partners, privacy policy, terms of service, and the Saif Ali Zaib news article. The article's canonical URL and Research Sources block were present. The public `/news` clean route also worked.

Main pages were checked at desktop width and 390px mobile width. Auction tab switching worked. The auction mobile menu did not open. The saved July auction snapshot still displayed a live badge. The visible tables contained malformed names such as “Sahil Patel unsold, Bipin Prasad Sharma” and “37 players sold”. Contact source inspection confirmed that submit only displayed a success alert and cleared the form; no message was delivered. Header search and newsletter signup had no service implementation.

## Changes in this repository

- Contact now prepares an email draft with named fields, encoded subject/body, published recipient addresses, and a clear unsent status. Editing the form invalidates the old draft link. Removed the contact page's unsupported head-office/map placeholder, which conflicted with its independent website identity.
- Auction parser splits mixed sold/unsold clauses, rejects aggregate counts as names, leaves missing prices unknown, and keeps the newest outcome when a player reappears. Missing source totals stop synchronization. Template validation finishes before output files are replaced.
- Corrected malformed saved table cells and removed aggregate/duplicate rows. No new live auction fetch or factual reconciliation was performed.
- Auction displays a historical snapshot label and a full source-update timestamp in Nepal time. Removed the forced in-progress schema status. A later feed failure preserves already loaded entries.
- Auction mobile navigation now opens/closes and supports Escape. Menu buttons have accessible names; generated news navigation exposes expanded state. Timeline header wraps on mobile, and tall mobile menus can scroll.
- Header search uses a generated local index of 183 pages, with keyboard navigation, empty results, and failure messaging.
- Nonfunctional newsletter forms were replaced with news archive links across the static pages. This shared footer change accounts for most of the HTML files in the diff.
- Eight homepage carousel images now have 480px/800px WebP variants. The 800px set is 375,622 bytes compared with 4,660,935 bytes for the originals (about 92% smaller). First slide loads eagerly; later slides use lazy loading. This is an asset-size comparison, not a measured page-speed score.
- Added an explicit Apache news archive rewrite, local preview command, README, CI build/validation checks, and regression tests. Existing live `/news` already worked; the rule makes the repository configuration explicit.

## Validation

- `npm run build`, `npm run news:validate`, and `npm test`: passed, 28 tests.
- All 16 existing news articles passed validation; no stories were removed or rewritten in `data/news.json`.
- All 183 indexed local HTTP routes returned 200.
- Local HTML references, including responsive image candidates, resolved to files.
- Inline JavaScript and JSON-LD parsed across all 184 HTML files.
- Browser-verified contact draft creation and edit invalidation without opening the email app or sending mail.
- Browser-verified search results, result navigation, keyboard focus, empty results and Escape dismissal.
- Browser-verified auction menu open/close/Escape, sold tab, snapshot timestamp and corrected cells.
- Rechecked the homepage and eight primary navigation pages at 390px: no horizontal overflow. Match filters showed four cards for All Matches and the empty state for Live.

## Deployment and remaining limits

Changes have not been committed, pushed or deployed. The public website still runs its previous version. CI was added locally; no hosted CI run is claimed. Local preview is a Node server, so production Apache redirects must be verified after deployment.

Contact requires the visitor's email app; no backend email or subscription service is configured. Historical auction tracker totals and timeline totals differ and need separate editorial source reconciliation before claiming final results. This audit tests site behavior and targeted parser repairs; it does not independently verify every player, squad, fixture or sponsorship claim. No Lighthouse score or full accessibility compliance audit is claimed.
