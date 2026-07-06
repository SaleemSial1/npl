# NPL Static Site Agent Rules

These rules apply to this static Nepal Premier League site. Read this file before fetching, writing, editing, generating, validating, or publishing any NPL news article.

## News Workflow

- Treat `data/news.json` as the source of truth for news articles.
- Generated outputs are `news.html`, `news/*.html`, `news-sitemap.xml`, homepage latest-news cards, and homepage hero news cards.
- Use `scripts/generate-news-pages.js` to regenerate pages after editing news data.
- Use `scripts/validate-news-system.js` and `tests/news-system.test.js` before claiming news work is complete.
- `npm run news:fetch` is extraction only. It updates `.news-cache/source-articles.json` and `.news-cache/source-articles.md`; it does not publish.
- Do not remove existing news stories from `data/news.json` unless the user explicitly asks.

## NPL-Only Scope

- Only Nepal Premier League cricket stories are valid.
- Reject other meanings of NPL, including National Physical Laboratory, National Premier League, National Pickleball League, and Nepal Police.
- Reject IPL, PSL, CPL, LPL, football, FIFA, UEFA, and unrelated cricket stories.
- If a fetched story is ambiguous, skip it until the original source page confirms Nepal Premier League cricket context.

## Research Rules

- Use Google News or search only as a discovery layer.
- Verify the story from original source pages before writing.
- Use the latest verified information available at the time of writing.
- For auctions, squads, broadcast, streaming, teams, sponsorship, fixtures, or player movement, verify against at least two trusted source domains whenever possible.
- Keep source metadata in `sources` and `imageSource`.
- Do not copy source wording. Rewrite every verified fact in original editorial language.
- If source content is too thin, mismatched with the headline, blocked, or unclear, do not publish from it.

## Article Writing Rules

- New NPL news articles must be at least 900 words unless the user explicitly gives a smaller target.
- Every article must be built from verified facts, not filler, speculation, or generic cricket commentary.
- Every sentence must trace to source content, existing site data, or clearly stated analysis from verified facts.
- Numbers and prices must match the source exactly. Never round or estimate auction prices, player counts, retained-player counts, purses, or dates.
- Never assign a player, team, official, broadcaster, or sponsor a role that the source does not confirm.
- Do not mix facts from another story into the current article unless that source is listed and directly relevant.

## Title Rules

- Never copy the source headline directly.
- Build the title from the strongest verified fact.
- Include the main subject naturally: Nepal Premier League, NPL 2026, auction, team, player, broadcaster, or streaming topic.
- Keep titles specific and useful. Avoid vague titles such as "Big NPL Update" or "What Fans Should Know".
- Recommended maximum: 110 characters.

## Opening Paragraph Rules

- No warmup sentence. The first sentence must carry the main fact.
- First sentence should answer who did what, and when or where if it matters.
- Keep the first sentence short and direct.
- Mention the primary keyword naturally in the first 100 words.
- Use 3 to 4 sentences in the opening paragraph.
- Do not open with a question, quote, scene-setting paragraph, or generic hype.

## Headings And Structure

- Headings must be story-specific. Avoid generic headings such as "Key Details", "Background and Context", "Impact and Analysis", "What Fans Should Know", "Why This Matters", "Looking Ahead", or "Conclusion".
- Use at least two real topic sections when the article page format supports headings.
- Never use `<h2>Conclusion</h2>`.
- Use bullet points only for genuine list facts, such as player lists, squad lists, fixture dates, or auction price lists.

## Source Handling

- Do not write source names inside normal article body prose.
- Avoid phrases such as "according to", "as reported by", "via", "source:", or "originally published".
- Public source links may appear only in the generated `Research Sources` block or schema citation fields.
- The article body must read as original NPL editorial copy, while the data file keeps the research trail.

## Internal Linking Rules

- Internal links must help the reader.
- Use maximum five body internal links, plus one related-news link if the template supports it.
- Never place links inside headings.
- Never use weak anchor text such as "click here", "read more", "this page", "this article", "guide", or "update" when a more descriptive anchor is possible.
- Link only once to the same URL in a body.

## Image Rules

- Do not use AI-generated news images.
- New article images should be topic-matched images found through web/Google search and stored locally.
- Every new article image must include `imageSource` metadata with source name, original image URL, source page URL, discovery method, and type.
- One image must not be reused by multiple news articles.
- Legacy articles may use restored existing site assets when the user asks to restore old images.

## Schema Rules

- Every generated article must include valid `NewsArticle` JSON-LD.
- `dateModified` must differ from `datePublished` by at least one minute.
- Publisher logo schema must include width and height.
- `alternativeHeadline` must differ from `headline`.
- Do not add `FAQPage` schema unless visible FAQ content exists and the user asks for FAQ support.
- Schema facts must match visible article content and `data/news.json`.

## Banned Language

Never use these in NPL news body copy:

- however
- furthermore
- additionally
- therefore
- meanwhile
- notably
- according to sources
- according to reports
- as reported by
- this page
- this article
- the table below shows
- the following table
- here is a summary
- it is no secret
- needless to say
- at the end of the day
- only time will tell
- fans will be watching closely
- as the tournament draws closer
- in a recent development
- things are heating up
- the countdown is on
- there is growing excitement
- with just weeks to go
- cycle, unless it is part of an official quoted name

## Quality Gate Before Publishing

Before publishing a new NPL news article, confirm:

- The topic is Nepal Premier League cricket only.
- The article is 900+ words or the user explicitly approved a smaller target.
- The title is rewritten from the source headline.
- The opening sentence contains the strongest verified fact.
- Every player, team, sponsor, broadcaster, count, price, and date is source-backed.
- Source names do not appear in body prose.
- Banned phrases are absent.
- The article has at least three research sources when it is a deep-research article.
- The image is local, topic-matched, not AI-generated, and not reused.
- `npm run news:generate`, `npm run news:validate`, and `npm test` pass.
- For public publishing, verify the live URL separately after pushing.
