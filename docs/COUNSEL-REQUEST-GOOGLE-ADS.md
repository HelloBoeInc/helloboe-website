# Draft request to counsel — Google Ads conversion measurement on helloboe.com

_Drafted 2026-08-27 for Andrew's review before sending. This describes what we
want to do and which policy passages it touches; the revised language itself
is counsel's to write._

---

**What we want to do.** Run Google Ads campaigns for the HelloBoe app and
measure, on helloboe.com only, whether an ad click leads to a tap on the
App Store / Google Play download badge. Implementation is Google's gtag with
**Consent Mode v2 defaults denying all storage**: the tag sets **no cookies
and stores nothing in the browser**. On a badge tap it sends Google a
cookieless conversion ping (IP address, user agent, page URL, and the
conversion label); Google statistically models attribution from those pings.
We are **not** enabling remarketing, audience building, or any cross-site
personalization, and nothing changes in the mobile app.

**Why we're asking first.** Section — (Your California Privacy Rights /
universal opt-out) provides that any future advertising use requires updating
the Privacy Policy to describe it before it begins. Three current statements
are affected:

1. *"Our marketing and policy website does not currently set advertising or
   analytics cookies."* (Automatically Collected Information) — remains
   literally true under the cookieless configuration; flagging so you can
   confirm you're comfortable keeping it, or qualify it.
2. *"We do not permit third-party advertising networks to collect information
   through the Services, and we do not serve behavioral or targeted
   advertising."* (Third-Party Tracking Technologies) — the conversion ping
   is collection by an advertising network, so this sentence needs to
   describe the limited conversion-measurement use.
3. *"Because we do not sell or share your personal information and do not
   engage in targeted advertising, there is no such processing for a
   universal opt-out signal to apply to."* (GPC / universal opt-out) — please
   advise whether cookieless, measurement-only pings to Google constitute
   "sharing" under CPRA and whether we need to honor GPC and/or offer a
   "Do Not Sell or Share" mechanism once this is live.

**Also queued for the same revision** (pre-existing open item recorded in
`site.config.json`): the "Who We Share Your Information With" section names
Mixpanel, RevenueCat and Sentry individually; our website analytics provider
is Plausible (cookieless) and should be added to that list. Google
(advertising measurement) would presumably join it.

**What we need back:** revised `privacy.json` text for the three passages
above (plus the vendor list), and your view on the GPC question. The tag is
already implemented behind an off switch; we will enable it only in the same
deployment that publishes your revised policy.
