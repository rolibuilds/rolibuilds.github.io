# rolibuilds.github.io
Finance, automation and better ways of working.

## Analytics (internal note)

Cloudflare Web Analytics is used for aggregate site-usage measurement (page views). The standard Cloudflare beacon is placed once, just before `</body>`, in `en/index.html` and `hu/index.html`. The root `index.html` is a redirect stub and carries no beacon.

- No cookies, local storage, user IDs or consent banner are added by this integration; SPA mode is off because the site is a traditional multi-page site with anchor navigation.
- No Content Security Policy is defined. If one is added later, allow `https://static.cloudflareinsights.com` (script) and `https://cloudflareinsights.com` (reporting).
- There is no local/production gating, so local page loads may appear in analytics.
- The site token is a public identifier, not a secret.
