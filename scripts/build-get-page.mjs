#!/usr/bin/env node
/**
 * build-get-page.mjs — generate get/index.html, the /get redirect for
 * helloboe.com (the email ladder's install link; gate sweep CC-9 website, B7).
 *
 * /get reads navigator.userAgent once and sends an iPhone, iPad or iPod to the
 * App Store, Android to Google Play and anything else to the homepage, with
 * this page's own query string appended unchanged to whichever destination it
 * picks (both stores ignore unknown parameters, the homepage keeps its utm
 * values). The page is noindex/nofollow, carries no analytics and no script
 * besides the redirect, and without JavaScript falls back to a meta refresh
 * to the homepage after two seconds plus a plain page in the site's shell with
 * the three links.
 *
 * The store URLs are read from staging-src/content.json (`links.appStore` and
 * `links.googlePlay`, the only copies in the repo) and the homepage from
 * staging-src/site.config.json (`url`), so this page can never drift from the
 * site. Never hand-edit get/index.html; re-run this.
 *
 * Usage:
 *   node scripts/build-get-page.mjs           # generate get/index.html, then verify it
 *   node scripts/build-get-page.mjs --check   # verify the written file only
 *
 * checkGetPage() is the jest-free check `npm run check:get` runs and that
 * build-staging.mjs runs before every build: it loads get/index.html as text
 * and asserts the three URLs and the robots meta are present.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const OUT = resolve(REPO, 'get/index.html');
const ROBOTS_META = '<meta name="robots" content="noindex, nofollow">';

/** The three destinations, from the site's own config, never a second copy. */
export function getDestinations() {
  const content = JSON.parse(readFileSync(resolve(REPO, 'staging-src/content.json'), 'utf8'));
  const config = JSON.parse(readFileSync(resolve(REPO, 'staging-src/site.config.json'), 'utf8'));
  const appStore = content.links && content.links.appStore;
  const googlePlay = content.links && content.links.googlePlay;
  const home = config.url;
  for (const [name, value] of [['links.appStore', appStore], ['links.googlePlay', googlePlay], ['url', home]]) {
    if (typeof value !== 'string' || !/^https:\/\//.test(value)) {
      throw new Error(`build-get-page: ${name} is not an https URL in the site config`);
    }
  }
  return { appStore, googlePlay, home };
}

/** Escape for element content and attribute values. */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderGetPage({ appStore, googlePlay, home }) {
  // JSON.stringify gives the inline script valid, quoted string literals.
  const js = (s) => JSON.stringify(s);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${ROBOTS_META}
<title>HelloBoe</title>
<script>
  // One read of the user agent, then the store or the homepage, with this
  // page's own query string carried over unchanged. Nothing else runs here.
  (function () {
    var ua = navigator.userAgent || '';
    var dest = /iPhone|iPad|iPod/.test(ua) ? ${js(appStore)}
      : /Android/.test(ua) ? ${js(googlePlay)}
      : ${js(home)};
    var q = location.search;
    if (q && q.length > 1) dest += (dest.indexOf('?') === -1 ? '?' : '&') + q.slice(1);
    location.replace(dest);
  })();
</script>
<noscript><meta http-equiv="refresh" content="2;url=${esc(home)}"></noscript>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;1,6..12,400&display=swap" rel="stylesheet">
<style>
  :root { --sand: #FBF4EA; --blue: #0076CE; --orange: #F15A29; --black: #1C1C1C; --white: #FFFFFF; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--sand); color: var(--black); font-family: 'Nunito Sans', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  header { padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(28, 28, 28, 0.08); }
  .header-logo img { height: 26px; width: auto; display: block; }
  .header-email { font-size: 13px; font-weight: 500; color: var(--black); opacity: 0.4; text-decoration: none; }
  .doc { max-width: 720px; margin: 0 auto; padding: 56px 24px 96px; }
  .doc-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: clamp(28px, 5vw, 40px); letter-spacing: -0.01em; line-height: 1.15; }
  .doc-rule { height: 3px; width: 48px; background: var(--orange); border-radius: 2px; margin: 24px 0 20px; }
  .get-links { font-size: 16px; line-height: 1.7; }
  .get-links a { color: var(--blue); font-weight: 600; text-decoration: none; }
  .get-links a:hover { text-decoration: underline; }
  footer { max-width: 720px; margin: 0 auto; padding: 32px 24px 56px; border-top: 1px solid rgba(28, 28, 28, 0.08); display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: center; justify-content: space-between; }
  .footer-copy { font-size: 13px; color: var(--black); opacity: 0.45; }
  .footer-email { font-size: 13px; font-weight: 500; color: var(--black); opacity: 0.5; text-decoration: none; }
  @media (max-width: 640px) { header { padding: 20px 20px; } .doc { padding: 40px 20px 72px; } }
</style>
</head>
<body>

  <header>
    <a href="/" class="header-logo" aria-label="HelloBoe">
      <img src="/assets/helloboe_logo_horizontal_black.png" alt="HelloBoe">
    </a>
    <a href="mailto:support@helloboe.com" class="header-email">support@helloboe.com</a>
  </header>

  <main class="doc">
    <h1 class="doc-title">Opening HelloBoe.</h1>
    <div class="doc-rule"></div>
    <p class="get-links"><a href="${esc(appStore)}">App Store</a> &middot; <a href="${esc(googlePlay)}">Google Play</a> &middot; <a href="${esc(home)}">helloboe.com</a></p>
  </main>

  <footer>
    <div class="footer-copy">&copy; 2026 HelloBoe, Inc. All rights reserved.</div>
    <a href="mailto:support@helloboe.com" class="footer-email">support@helloboe.com</a>
  </footer>

</body>
</html>
`;
}

/**
 * The jest-free check: the written page carries the three URLs (as the site
 * config states them) and the robots meta, and no analytics or external
 * script. Throws with every reason it found.
 */
export function checkGetPage() {
  if (!existsSync(OUT)) throw new Error('get/index.html is missing: run node scripts/build-get-page.mjs');
  const html = readFileSync(OUT, 'utf8');
  const { appStore, googlePlay, home } = getDestinations();
  const missing = [];
  for (const [name, needle] of [['App Store URL', appStore], ['Google Play URL', googlePlay], ['homepage URL', home], ['robots meta', ROBOTS_META]]) {
    if (!html.includes(needle)) missing.push(`${name} (${needle})`);
  }
  if (/plausible/i.test(html) || /<script[^>]+\bsrc=/i.test(html)) missing.push('no analytics and no external script allowed on /get');
  if (missing.length) throw new Error(`get/index.html check failed: ${missing.join(', ')}`);
  return { appStore, googlePlay, home };
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const checkOnly = process.argv.includes('--check');
  try {
    if (!checkOnly) {
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, renderGetPage(getDestinations()));
    }
    const d = checkGetPage();
    console.log(`${checkOnly ? 'Verified' : 'Generated + verified'} get/index.html: iPhone, iPad, iPod to ${d.appStore}; Android to ${d.googlePlay}; everything else to ${d.home}; noindex, nofollow; no analytics.`);
  } catch (err) {
    console.error(`\n  ERROR  ${err.message}\n`);
    process.exit(1);
  }
}
