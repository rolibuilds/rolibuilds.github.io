# rolibuilds.github.io
Finance, automation and better ways of working.

## Analytics (internal note)

Cloudflare Web Analytics is used for aggregate site-usage measurement (page views). The standard Cloudflare beacon is placed once, just before `</body>`, in the root `index.html`, which is the English page. (`en/index.html` and `hu/index.html` are redirect shells to `/` and carry no beacon.)

- No cookies, local storage, user IDs or consent banner are added by this integration; SPA mode is off because the site is a traditional multi-page site with anchor navigation.
- No Content Security Policy is defined. If one is added later, allow `https://static.cloudflareinsights.com` (script) and `https://cloudflareinsights.com` (reporting).
- There is no local/production gating, so local page loads may appear in analytics.
- The site token is a public identifier, not a secret.

## Recommendations (internal note)

- All three recommendation authors approved publication on the portfolio. The approval covers the recommendation text, name, professional title and supplied profile image.
- The content originated as LinkedIn recommendations. The full wording is reproduced verbatim (including original punctuation); excerpts are exact extracts.
- Portraits are 160×160 web derivatives in `assets/images/career/recommendations/` (metadata stripped, originals not stored in the repository).
- The section sits between Professional Career and Outside work in `index.html` and keeps the mobile context bar hidden. It shows two short excerpts with a link to the full text on LinkedIn.

## Routing

The English page is served directly at `/` (`index.html`), with no redirect. `en/index.html` and `hu/index.html` are small redirect pages to `/` (meta refresh, JavaScript redirect, canonical to `/`), because GitHub Pages has no server-side redirects. Neither page carries a robots directive. There is no Hungarian page or language switch at the moment. The earlier Hungarian draft is in git history: restore it with `git checkout 5f864cb -- hu/index.html` (also on `backup/portfolio-stable-5f864cb`).

## Search

No robots-blocking directive is used on any page. `robots.txt` allows all crawlers and points to `sitemap.xml`, which lists only `https://rolandmalczanek.com/`.

## Cache busting

GitHub Pages serves CSS and JS with a 10-minute cache, so a visitor can briefly get new HTML with an old stylesheet. The page links `styles.css`, `main.js` and `theme-init.js` with a `?v=` query. Bump that value in `index.html` whenever those files change.
