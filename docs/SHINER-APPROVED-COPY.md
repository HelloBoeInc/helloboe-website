# Dr. Rebecca Shiner — Approved Copy (Exhibit A)

_Last updated: 2026-08-27. Source: Exhibit A — "Approved Attribution and
Biographical Texts" from the signed contractor agreement (supersedes and
ratifies the 2026-07-05 email strings). The app-side governance doc lives at
`HelloBoeNative/docs/SHINER-ATTRIBUTION-PLACEMENT.md`._

**Any copy about Dr. Shiner, anywhere on this site, must be one of the three
texts below, VERBATIM. Never paraphrase, never remix, never trim.** The
2026-08-27 correction exists because the site shipped "Professor of Psychology
and Brain sciences" — her department is **Psychological and Brain Sciences**.

## 1. Attribution (≤10 words)

> Scientific Advisor — Dr. Rebecca Shiner, Colgate University

## 2. Attribution + Methodology (~20–25 words)

> Dr. Rebecca Shiner, Professor of Psychological and Brain Sciences at Colgate
> University, is HelloBoe's Scientific Advisor and has reviewed and advised on
> our temperament methodology.

**This is the text currently live on the site** — split across the
`advisor.name` + `advisor.body` fields in `staging-src/content.json`
(the name field carries "Dr. Rebecca Shiner," so the two fields concatenate
to the approved sentence exactly).

## 3. Full Biography (~55–65 words)

> Dr. Rebecca Shiner is a developmental psychologist, Professor of
> Psychological and Brain Sciences, and department chair at Colgate
> University, where her research focuses on personality development in
> childhood. As HelloBoe's Scientific Advisor, she has reviewed and advised on
> the methodology behind our temperament profiles — helping ensure the
> approach reflects established research on how young children differ, while
> the profiles remain a practical lens for parents, not a clinical assessment.

Per Contractor's correspondence, the "department chair" descriptor in the full
biography is **optional** and may be omitted at the Company's discretion. That
is the ONLY permitted variation in any of the three texts.

## Practical notes

- **Em-dashes:** texts 1 and 3 contain em-dashes, which the copy lint in
  `scripts/build-staging.mjs` blocks for content.json strings. The verbatim
  requirement wins: if either text is ever placed in content.json, add a
  narrowly-scoped lint exemption for the advisor fields rather than editing
  her wording.
- **No personal-voice quote is authorized.** She deferred quotes to
  post-launch (see the app-side placement doc). Do not invent one.
- The native app's single source of truth for her copy is
  `HelloBoeNative/src/content/researchCredibility.ts` — already verbatim.
