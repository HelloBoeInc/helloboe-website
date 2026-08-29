# helloboe-website

Marketing site for helloboe.com. Static, GitHub Pages, deploys from `main`
root. Separate repo from the HelloBoeNative app — the app repo's CLAUDE.md
rules (HBR, expo, tsc hooks) do not apply here.

## Workflow

- All site copy lives in `staging-src/content.json`; config/meta in
  `staging-src/site.config.json`. See `EDITING.md` for the full editing and
  build workflow (gated /staging vs public root, GitHub Action, house rules).
- After editing site source, rebuild the public site with
  `node scripts/build-staging.mjs --public --skip-install` and commit
  `index.html` + `site-assets/bundle/` together with the source change.

## Hard constraints

- **Dr. Rebecca Shiner copy is contractually constrained.** Any mention of
  her, on any surface, must use one of the three approved texts in
  `docs/SHINER-APPROVED-COPY.md` VERBATIM (Exhibit A of her agreement).
  Her department is "Psychological and Brain Sciences" — never "Psychology".
  No quotes from her are authorized.
- Copy lint (em-dash ban, banned words) is enforced by
  `scripts/build-staging.mjs` on every build — see EDITING.md "House rules".
- Legal pages (`privacy/`, `terms/`, `disclaimer/`) are generated from
  counsel-approved JSON by `scripts/build-legal-pages.mjs`; never hand-edit.
- Public builds are pre-rendered and hydration-deferred for mobile scroll
  performance; touch devices intentionally get reduced motion
  (`@media (pointer: coarse)` in `staging-src/src/index.css`). Do not
  "restore" full motion on mobile or make hydration synchronous.
