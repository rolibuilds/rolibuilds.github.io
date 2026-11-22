# rolibuilds.github.io
Finance, automation and better ways of working.

## Analytics (internal note)

Cloudflare Web Analytics is used for aggregate site-usage measurement (page views). The standard Cloudflare beacon is placed once, just before `</body>`, in `en/index.html`. (`hu/index.html` is currently a redirect shell and carries no beacon.) The root `index.html` is a redirect stub and carries no beacon.

- No cookies, local storage, user IDs or consent banner are added by this integration; SPA mode is off because the site is a traditional multi-page site with anchor navigation.
- No Content Security Policy is defined. If one is added later, allow `https://static.cloudflareinsights.com` (script) and `https://cloudflareinsights.com` (reporting).
- There is no local/production gating, so local page loads may appear in analytics.
- The site token is a public identifier, not a secret.

## Recommendations (internal note)

- All three recommendation authors approved publication on the portfolio. The approval covers the recommendation text, name, professional title and supplied profile image.
- The content originated as LinkedIn recommendations. The full wording is reproduced verbatim (including original punctuation); excerpts are exact extracts.
- Portraits are 160×160 web derivatives in `assets/images/career/recommendations/` (metadata stripped, originals not stored in the repository).
- The section sits between Professional Career and About in `en/index.html` and keeps the mobile context bar hidden.

## Hungarian page (temporary)

Hungarian public route temporarily redirects to /en/ until full EN/HU localisation and parity work is completed. `hu/index.html` is a minimal redirect shell (noindex, canonical to /en/, JavaScript redirect plus meta refresh). The unfinished Hungarian document is kept in git history, not in the published tree (the site is served with `.nojekyll`, so any file in the repository is public): restore it with `git checkout 5f864cb -- hu/index.html` (also on `backup/portfolio-stable-5f864cb`). To restore: replace the shell with that document, complete parity and localisation testing, then restore the language switch and hreflang metadata.
