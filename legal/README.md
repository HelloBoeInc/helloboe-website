# Hosted legal pages (`/privacy`, `/terms`, `/disclaimer`)

These are the public, hosted copies of HelloBoe's legal documents, required by
Apple (App Store Review 5.1.1(i)) and Google Play (User Data policy) for store
submission. They are **verbatim** copies of the text a parent assents to in the
app — never edited by hand here.

## Source of truth

The canonical text lives in the **app repo** (`HelloBoeInc/helloboe-app`) at
`src/content/legal/{privacy,terms,disclaimer}.json`, generated verbatim from
counsel's 06-30 `.docx` finals by that repo's `scripts/build-legal-assets.mjs`.
The version is tied to `CONSENT_VERSION` (currently **2.0**, "June 30, 2026").

`legal/source/*.json` here are byte-for-byte copies of those files (verified by
`shasum -a 256` at vendor time). Do **not** edit them.

## How the pages are built

`scripts/build-legal-pages.mjs` reads `legal/source/*.json` and renders
`{privacy,terms,disclaimer}/index.html` — one clean extensionless URL each on
GitHub Pages. Each heading block becomes `<h2>`, each body block `<p>`; the text
is escaped for HTML but otherwise untouched (curly quotes, dashes, URLs stay
raw), so the rendered text is byte-identical to the source. The generator then
**round-trips** (re-extracts the text from the HTML and asserts a matching
`sha256`) — that check is the verbatim proof.

```bash
node scripts/build-legal-pages.mjs          # generate + verify
node scripts/build-legal-pages.mjs --check  # verify only, no write
```

## Discoverability (intentional, pre-launch)

The pages are fully readable at their direct URLs with no auth, but kept out of
search and off navigation until launch:

- `<meta name="robots" content="noindex, nofollow">` on every page
- root `robots.txt` `Disallow`s `/privacy`, `/terms`, `/disclaimer`
- **nothing links to them** — not `index.html`, not `staging/`, no `sitemap.xml`

Do not add inbound links or a sitemap entry before launch.

## Updating when counsel issues new text

1. In the **app repo**, re-run `scripts/build-legal-assets.mjs` and bump
   `CONSENT_VERSION` + the generator `--version` in lockstep.
2. Copy the three refreshed JSON into `legal/source/` here. Confirm the
   `shasum -a 256` of each matches the app repo's copy.
3. Re-run `node scripts/build-legal-pages.mjs` and commit the regenerated HTML.
4. Open a PR (never push `main` — `protect-main` requires review).
