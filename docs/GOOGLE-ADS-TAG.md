# Google Ads tag — wired dark, counsel-gated

_Created 2026-08-27. Status: **implemented but DISABLED** (`googleAds.enabled:
false` in `staging-src/site.config.json`)._

## Why it is off

The live counsel-approved privacy policy (consent version 2.0, revised
2026-06-30) states:

1. "Our marketing and policy website does not currently set advertising or
   analytics cookies."
2. "We do not permit third-party advertising networks to collect information
   through the Services, and we do not serve behavioral or targeted
   advertising."
3. Any future advertising use requires that we first "(a) update this Privacy
   Policy to describe that use, (b) obtain any separate, purpose-specific
   consent that may be required, and (c) provide any opt-out or other choice
   required by applicable law."

Clause 3 prescribes the order of operations: **policy first, tag second.**
The counsel ask is drafted in `COUNSEL-REQUEST-GOOGLE-ADS.md`.

## What is already wired (no code work left)

- **Tag emission** — `scripts/build-staging.mjs` emits the gtag loader for
  tag `AW-18429195722` into the public page head when
  `googleAds.enabled && launched`. It runs under **Consent Mode v2 with all
  four storage categories denied**, pushed to the dataLayer *before* gtag.js
  loads: no cookies are ever set; Google receives cookieless pings and models
  conversions. This keeps policy statement 1 true even after enablement;
  statement 2 is the one that needs counsel's revised language.
- **Conversion event** — the store-badge click handler (`trackDownload` in
  `staging-src/src/HelloBoePage.tsx`) fires the "Outbound click" conversion
  (`AW-18429195722/7jsQCOGv_O0cEMrr3NNE`, value 1.0 USD) alongside the
  existing Plausible "Download Click" event. It reads the label from
  `window.__HB_ADS`, which only exists when the tag is enabled — with the
  flag off, the handler is a no-op and the bundle contains no Google URLs.
  Note: Google's emailed instructions suggested pasting the event snippet
  into `<head>`, which would have counted every page *load* as a conversion;
  wiring it to the badge click is the correct implementation of an
  "Outbound click" goal. The badges open in a new tab, so no
  `event_callback` navigation-deferral is needed.

## To go live (after counsel's policy lands)

1. Counsel's revised `privacy.json` goes through the normal legal pipeline
   (`scripts/build-legal-pages.mjs` — never hand-edit the HTML).
2. Flip `googleAds.enabled` to `true` in `staging-src/site.config.json`.
3. `node scripts/build-staging.mjs --public --skip-install`, commit
   `index.html` + `site-assets/bundle/` + the config + regenerated legal
   pages **in the same commit**, push.
4. Verify: Google Tag Assistant (tagassistant.google.com) on helloboe.com
   should detect AW-18429195722 with consent state denied; click a store
   badge and confirm the conversion fires. Google Ads shows the conversion
   as "recorded" within ~3 hours.

## Deliberate limitations

- **Cookieless = modeled attribution.** Google models some conversions
  instead of observing them all; counts will read slightly lower/smoother
  than cookie-based tracking. This is the accepted trade for keeping the
  no-cookies statement true and avoiding a consent banner.
- **Do not add remarketing/audience features** — that is squarely the
  "sharing" CPRA territory the policy disclaims. Conversion measurement only.
- **No SRI on the script tag** — gtag.js is served dynamically per tag and
  cannot be integrity-pinned (same as the Plausible tag).
