# Site verification — 19 September 2026

## Verified coverage

- All 222 deployed HTML routes returned HTTP 200 and contained one H1 in the fresh live crawl.
- All 222 local HTML routes returned HTTP 200.
- Automated checks cover internal links, assets, anchor targets, inline scripts, JSON-LD, search destinations, roster identities, source references, auction prices and team purse totals.
- Browser checks at 390px covered player search plus combined team/status filters, mobile menu open/Escape, auction tab clicks and keyboard navigation, schedule, stats, teams, Biratnagar, Dilsad Ali, matches, tickets, streaming and points table. These checked pages had no document overflow or broken images.
- Auction tabs displayed 53 sold records and all 155 tracker records. Janakpur's overseas filter displayed two reviewed entries.

## Fixes in this continuation

- Corrected dark season backgrounds conflicting with the new light heading palette, including schedule body copy, cards and status colours.
- Restored readable search placeholder/icon and contrast behind the white site logo.
- Preserved the redesigned schedule through a maintained template, so builds no longer replace it with the generic guide.
- Regenerated player directory/comparison from current shared data.
- Replaced obsolete auction-page rewriting with research-only extraction. The wrapper no longer resets a checkout or automatically pushes auction changes. A real extraction successfully saved the 155-record source count without publishing changes.
- Added four regression checks. All 32 tests and news validation passed; repeated generation produced no content drift before the final colour-only change.

## Remaining editorial limits

HTTP success is not proof of every factual statement. Source disagreements remain visible: the auction tracker, timeline and reports have different totals; Dilsad Ali and Sahil Patel have disputed outcomes. Overseas coverage is partial. The reviewed season dataset remains dated 18 September; this continuation does not claim a fresh factual verification of every biography or historical statistic. Custom team/player designs are maintained directly and require editorial comparison when shared data changes. Existing news stories are preserved.

The changes listed above are local. The live crawl checked the deployed version; it does not establish that these new fixes are deployed.
