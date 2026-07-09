# HelloBoe Website — TODO

Backlog for the marketing site (this repo). The native app is tracked separately
in the app repo's `HELLOBOE-BUILD-REMAINING.md`.

## Backlog

- [ ] **At public launch, make the legal + deletion pages discoverable.** The
  hosted `/privacy`, `/terms`, `/disclaimer`, `/delete-account` pages ship
  pre-launch as `noindex` + `robots.txt`-disallowed + unlinked (readable at the
  direct URL for App Store / Play review, but out of search). At launch: add
  footer links to Privacy/Terms on the public site, and — required by Google
  Play — make `/delete-account` **readily discoverable** (link it + drop its
  `noindex` and its `robots.txt` Disallow). See `legal/README.md`.

- [ ] **Wire in web analytics.** Deferred 2026-06-04 (holding for now, per Andrew).
  Add to the public coming-soon page (`/`) now, and to the launch site when
  `/staging/` is promoted public. Recommended: a privacy-first, cookieless tool
  (Plausible or Fathom) to fit HelloBoe's CCPA/CPRA posture and avoid a cookie
  consent banner. Alternatives: Mixpanel (unifies with the app's install funnel)
  or GA4 (free, but privacy-heavy). Action: pick the tool + get the site ID, then
  drop in a one-line script.

- [ ] **Preserve a durable plaintext source for the gated `/staging/` site.** The
  full marketing page currently exists in plaintext only *outside* this repo (the
  Claude Design bundle + a local build dir); the repo intentionally ships it as
  AES ciphertext so the copy isn't public. To promote `/staging/` to the root at
  launch (un-gated), the plaintext must be regenerated/committed then. Decide
  where the durable source + build scripts live (private repo or local backup).

- [ ] **(Optional, stronger auth)** Replace the shared-password gate with
  Cloudflare Access (Google sign-in restricted to `@helloboe.com`) for true
  server-side per-email enforcement. Requires migrating DNS to Cloudflare first
  (currently on Google Domains nameservers → GitHub Pages direct).

## Done

- [x] 2026-07-09 — Hosted legal + deletion pages added: `/privacy`, `/terms`,
  `/disclaimer` (verbatim from counsel's 06-30 finals, generated from the app
  repo's `src/content/legal/*` via `scripts/build-legal-pages.mjs`) + a
  purpose-built `/delete-account` (Google Play deletion route). All `noindex`,
  `robots.txt`-disallowed, and unlinked pre-launch. Closes LB2's hosted-URL
  half + the Play deletion-URL requirement.
- [x] 2026-06-04 — Premium marketing site built behind an invite-only gate at
  `/staging/` (AES-256-GCM, PBKDF2 600k, SHA-256-hashed email allowlist). Live
  coming-soon page at `/` preserved untouched.
- [x] 2026-06-04 — Reduced em-dash usage in the marketing copy so it reads less
  like AI-generated text.
