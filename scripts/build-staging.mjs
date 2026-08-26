#!/usr/bin/env node
/**
 * build-staging.mjs — build the HelloBoe marketing site and publish it to
 * /staging behind the password gate.
 *
 * WHAT THIS PRODUCES
 *   staging/index.html — a login card plus one AES-GCM encrypted blob holding
 *   the entire site. Nothing about the page (copy, images, fonts, layout) is
 *   readable until the correct password decrypts it in the browser.
 *
 * WHY IT IS ENCRYPTED RATHER THAN JUST HIDDEN
 *   helloboe.com is GitHub Pages. GitHub Pages is a static file host with no
 *   server-side layer, so real HTTP basic auth is not available: any file it
 *   serves, it serves to everyone. A JavaScript "login" that merely hides a
 *   div is theatre — the content is in the page source either way. Encrypting
 *   the payload means the bytes on disk are useless without the password.
 *
 * USAGE
 *   HELLOBOE_STAGING_PASSWORD='...' npm run build:staging
 *
 *   --skip-install   reuse staging-src/node_modules (faster on repeat runs)
 *   --public         write the site UNENCRYPTED to index.html at the repo root.
 *                    This is the launch-day path: it removes the wall entirely.
 *                    Refuses to run unless site.config.json has launched:true,
 *                    so the wall cannot come down by accident.
 *   --dry-run        build and verify, write nothing.
 *
 * THE PASSWORD IS NEVER WRITTEN TO DISK OR COMMITTED. It is read from the
 * environment, used to derive a key, and discarded. Only the salt, the IV and
 * the ciphertext are stored, which is exactly what a browser needs to decrypt
 * and exactly what an attacker cannot work backwards from.
 *
 * VERIFICATION
 *   Every run decrypts its own output and asserts it is byte-identical to the
 *   payload that went in. A build that cannot be decrypted fails loudly here
 *   rather than silently shipping an unopenable page.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const SRC = resolve(REPO, 'staging-src');
const DIST = resolve(SRC, 'dist');

const ARGS = new Set(process.argv.slice(2));
const SKIP_INSTALL = ARGS.has('--skip-install');
const PUBLIC_MODE = ARGS.has('--public');
const DRY_RUN = ARGS.has('--dry-run');

/** PBKDF2 work factor. OWASP's 2023 floor for PBKDF2-HMAC-SHA256.
 *  Must stay in step with the ITER constant emitted into the gate below. */
const PBKDF2_ITERATIONS = 600_000;

const log = (...a) => console.log('  ', ...a);
const fail = (msg) => {
  console.error(`\n  ERROR  ${msg}\n`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// 1. Configuration and preconditions
// ---------------------------------------------------------------------------

const config = JSON.parse(readFileSync(resolve(SRC, 'site.config.json'), 'utf8'));

const password = process.env.HELLOBOE_STAGING_PASSWORD;
if (!PUBLIC_MODE && !password) {
  fail(
    'HELLOBOE_STAGING_PASSWORD is not set.\n' +
      "         Run:  HELLOBOE_STAGING_PASSWORD='the password' npm run build:staging",
  );
}
if (PUBLIC_MODE && config.launched !== true) {
  fail(
    '--public writes the site with NO password gate, but site.config.json still\n' +
      '         has "launched": false. Set it to true in the same change that takes\n' +
      '         the wall down, so this can never happen by accident.',
  );
}

console.log(`\n  HelloBoe site build  ${PUBLIC_MODE ? '(PUBLIC, no gate)' : '(gated)'}\n`);

// ---------------------------------------------------------------------------
// 1b. Copy guardrails
//
// content.json tells whoever edits it that these rules are checked on every
// build. A rule that is only written down loses to whoever is in a hurry, so
// it is actually checked here.
//
// Two tiers, deliberately:
//   BLOCK — unambiguous brand violations and the em-dash ban (Universal Rule
//           #27). No legitimate use, so failing the build costs nothing.
//   WARN  — words banned only when aimed AT the child ("fix", "correct",
//           "train", "normal"), which CLAUDE.md explicitly carves out as
//           acceptable parenting-domain vocabulary. Blocking these would fail
//           already-approved copy such as "it isn't a problem to fix", so they
//           are surfaced for a human to judge instead.
// ---------------------------------------------------------------------------

const BLOCK_PATTERNS = [
  [/—/, 'em-dash (use a comma, colon or full stop; en-dash in ranges is fine)'],
  [/\bdifficult child\b/i, '"difficult child"'],
  [/\beasy child\b/i, '"easy child"'],
  [/\bhacks?\b/i, '"hack"'],
  [/\boptimi[sz]e\b/i, '"optimize"'],
  [/\bmaximi[sz]e\b/i, '"maximize"'],
  [/\b(mama|mommy|supermom)\b/i, 'mama / mommy / supermom'],
  [/\bjourney\b/i, '"journey"'],
  [/trust the process/i, '"trust the process"'],
  [/you'?ve got this/i, '"you\'ve got this!"'],
];
const WARN_PATTERNS = [
  [/\bfix\b/i, '"fix" — fine about a situation, never about the child'],
  [/\bcorrect\b/i, '"correct" — fine as a method, never aimed at the child'],
  [/\btrain\b/i, '"train" — never about the child'],
  [/\b(ab)?normal\b/i, '"normal" — only when normalizing a behavior, never as a verdict'],
];

function lintCopy() {
  const content = JSON.parse(readFileSync(resolve(SRC, 'content.json'), 'utf8'));
  const strings = [];
  const walk = (node, path) => {
    if (typeof node === 'string') return strings.push([path, node]);
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        // _readme and friends are notes to the editor, not site copy.
        if (k.startsWith('_')) continue;
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(content, '');

  const blocks = [];
  const warns = [];
  for (const [path, text] of strings) {
    // URLs are not prose.
    if (/^(https?:|mailto:|#|@links\.)/.test(text)) continue;
    for (const [re, label] of BLOCK_PATTERNS) if (re.test(text)) blocks.push(`${path}: ${label}`);
    for (const [re, label] of WARN_PATTERNS) if (re.test(text)) warns.push(`${path}: ${label}`);
  }

  log(`copy check: ${strings.length} strings`);
  warns.forEach((w) => console.log(`     WARN   ${w}`));
  if (blocks.length) {
    console.error('\n  COPY CHECK FAILED\n');
    blocks.forEach((b) => console.error(`     BLOCK  ${b}`));
    console.error('\n  Fix these in staging-src/content.json and try again.\n');
    process.exit(1);
  }
}
lintCopy();

// ---------------------------------------------------------------------------
// 2. Build the Vite app
// ---------------------------------------------------------------------------

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args) => execFileSync(npm, args, { cwd: SRC, stdio: 'inherit' });

if (!SKIP_INSTALL || !existsSync(resolve(SRC, 'node_modules'))) {
  log('installing dependencies…');
  run([existsSync(resolve(SRC, 'package-lock.json')) ? 'ci' : 'install', '--no-audit', '--no-fund']);
}
log('type checking…');
run(['run', 'typecheck']);
log('building…');
run(['run', 'build']);

// ---------------------------------------------------------------------------
// 3. Fold the emitted JS and CSS into a single HTML document
//
//    Vite has already inlined every image and font as a data: URI (see
//    assetsInlineLimit in vite.config.ts), so after this step the document has
//    no external dependencies at all. That is what lets it be encrypted as one
//    blob, and what lets it work at /staging today and at the site root later
//    with no path rewriting.
// ---------------------------------------------------------------------------

let html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const assetDir = resolve(DIST, 'assets');
const assets = existsSync(assetDir) ? readdirSync(assetDir) : [];

const jsFiles = assets.filter((f) => f.endsWith('.js'));
const cssFiles = assets.filter((f) => f.endsWith('.css'));
if (jsFiles.length !== 1) fail(`expected exactly 1 JS bundle, found ${jsFiles.length}: ${jsFiles}`);
if (cssFiles.length > 1) fail(`expected at most 1 CSS bundle, found ${cssFiles.length}`);

const jsCode = readFileSync(join(assetDir, jsFiles[0]), 'utf8');
const cssCode = cssFiles.length ? readFileSync(join(assetDir, cssFiles[0]), 'utf8') : '';

// Closing tags inside inlined content would terminate the host tag early.
const guardScript = (s) => s.replace(/<\/script/gi, '<\\/script');
const guardStyle = (s) => s.replace(/<\/style/gi, '<\\/style');

// Drop Vite's own tags and re-add the same content inline.
html = html
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>\s*/gi, '')
  .replace(/<link[^>]*rel="stylesheet"[^>]*>\s*/gi, '')
  .replace(/<link[^>]*rel="modulepreload"[^>]*>\s*/gi, '');

if (cssCode) {
  html = html.replace('</head>', `<style>${guardStyle(cssCode)}</style>\n</head>`);
}
// No type="module": the bundle is IIFE so it runs correctly after
// document.write(). See the format:'iife' note in vite.config.ts.
html = html.replace('</body>', `<script>${guardScript(jsCode)}</script>\n</body>`);

// ---------------------------------------------------------------------------
// 4. Metadata and analytics
//
//    These go into the PAYLOAD, not the gate, so they travel with the site: the
//    same head is correct at /staging now and at the site root after launch.
//    While gated they are inert for search engines, which cannot decrypt the
//    payload — that is the point of the wall, and why the gate carries its own
//    deliberately uninformative head further down.
// ---------------------------------------------------------------------------

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Absolute URL for an asset.
 *
 * Assets sit next to the page, and while the site is gated the page lives at
 * /staging/ rather than the site root. Resolving against config.url in that
 * state produces https://www.helloboe.com/site-assets/... which is a 404.
 * Canonical and og:url still use config.url — those describe where the site
 * will live, not where the file currently sits.
 */
const ASSET_BASE = config.launched ? config.url : new URL('staging/', config.url).href;
const abs = (p) => new URL(p, ASSET_BASE).href;

function buildHead() {
  const t = [];
  t.push(`<title>${esc(config.title)}</title>`);
  t.push(`<meta name="description" content="${esc(config.description)}">`);
  t.push(`<meta name="theme-color" content="${esc(config.themeColor)}">`);
  t.push(`<link rel="icon" type="image/png" href="${esc(config.favicon)}">`);
  t.push(`<link rel="apple-touch-icon" href="${esc(config.favicon)}">`);

  if (config.launched) {
    t.push(`<link rel="canonical" href="${esc(config.url)}">`);
    t.push(`<meta name="robots" content="index, follow, max-image-preview:large">`);
  } else {
    // Pre-launch the site must stay out of search entirely. Same posture the
    // legal pages already use (see robots.txt and legal/README.md).
    t.push(`<meta name="robots" content="noindex, nofollow">`);
  }

  // Open Graph
  t.push(`<meta property="og:type" content="website">`);
  t.push(`<meta property="og:site_name" content="${esc(config.shortTitle)}">`);
  t.push(`<meta property="og:title" content="${esc(config.title)}">`);
  t.push(`<meta property="og:description" content="${esc(config.description)}">`);
  t.push(`<meta property="og:url" content="${esc(config.url)}">`);
  t.push(`<meta property="og:locale" content="${esc(config.locale)}">`);
  t.push(`<meta property="og:image" content="${esc(abs(config.ogImage))}">`);
  t.push(`<meta property="og:image:width" content="${esc(config.ogImageWidth)}">`);
  t.push(`<meta property="og:image:height" content="${esc(config.ogImageHeight)}">`);
  t.push(`<meta property="og:image:alt" content="${esc(config.title)}">`);

  // Twitter / X
  t.push(`<meta name="twitter:card" content="summary_large_image">`);
  t.push(`<meta name="twitter:title" content="${esc(config.title)}">`);
  t.push(`<meta name="twitter:description" content="${esc(config.description)}">`);
  t.push(`<meta name="twitter:image" content="${esc(abs(config.ogImage))}">`);
  if (config.twitterSite) t.push(`<meta name="twitter:site" content="${esc(config.twitterSite)}">`);

  // Structured data. Only emitted once public — publishing an Organization
  // graph for a site search engines cannot reach is noise.
  if (config.launched) {
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'HelloBoe, Inc.',
          url: config.url,
          logo: abs(config.ogImage),
          email: 'support@helloboe.com',
        },
        {
          '@type': 'WebSite',
          name: config.shortTitle,
          url: config.url,
          description: config.description,
        },
        {
          '@type': 'MobileApplication',
          name: 'HelloBoe',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'iOS, Android',
          description: config.description,
        },
      ],
    };
    t.push(
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    );
  }

  // Analytics. Cookieless by choice — see the reasoning recorded in
  // site.config.json against the published privacy policy.
  const a = config.analytics || {};
  const analyticsOn = a.enabled && a.provider && a.provider !== 'none' && (config.launched || a.trackWhileGated);
  if (analyticsOn) {
    if (a.provider === 'plausible') {
      t.push(`<script defer data-domain="${esc(a.domain)}" src="${esc(a.scriptSrc)}"></script>`);
      // Queue stub so custom events (the store-badge "Download Click" goal in
      // HelloBoePage.tsx) never throw and are replayed once the script loads.
      t.push(
        `<script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>`,
      );
    } else if (a.provider === 'fathom') {
      t.push(`<script defer data-site="${esc(a.domain)}" src="${esc(a.scriptSrc)}"></script>`);
    } else {
      fail(`unknown analytics provider "${a.provider}" — use plausible, fathom or none`);
    }
  }

  return t.map((line) => '    ' + line).join('\n');
}

if (!html.includes('<!--HB:HEAD-->')) fail('index.html is missing the <!--HB:HEAD--> marker');
html = html.replace('<!--HB:HEAD-->', buildHead().trimStart());

const payload = html;
log(`payload: ${(Buffer.byteLength(payload) / 1024).toFixed(0)} KB of self-contained HTML`);

// ---------------------------------------------------------------------------
// 5. Public mode — no gate, no encryption
// ---------------------------------------------------------------------------

if (PUBLIC_MODE) {
  const target = resolve(REPO, 'index.html');
  if (DRY_RUN) {
    log(`dry run: would write ${target}`);
  } else {
    writeFileSync(target, payload, 'utf8');
    log(`wrote ${target} (public, unencrypted)`);
  }
  console.log('\n  Done.\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 6. Encrypt
// ---------------------------------------------------------------------------

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveKey'],
);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);
const cipherBuf = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  new TextEncoder().encode(payload),
);

const b64 = (buf) => Buffer.from(buf).toString('base64');

// Verify before writing: decrypt what we just produced and compare.
// A build that cannot be opened must fail here, not in someone's browser.
const roundTrip = new TextDecoder().decode(
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf),
);
if (roundTrip !== payload) fail('round-trip decryption did not match the payload');
log('round-trip decryption verified');

// ---------------------------------------------------------------------------
// 7. Emit the gate page
// ---------------------------------------------------------------------------

const gate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(config.gatedTitle)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<link rel="icon" type="image/png" href="${esc(config.favicon)}">
<style>
  @font-face{font-family:'Poppins';src:url('site-assets/fonts/Poppins-Regular.ttf') format('truetype');font-weight:400;font-display:swap}
  @font-face{font-family:'Poppins';src:url('site-assets/fonts/Poppins-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
  @font-face{font-family:'Poppins';src:url('site-assets/fonts/Poppins-Bold.ttf') format('truetype');font-weight:700;font-display:swap}
  @font-face{font-family:'Poppins';src:url('site-assets/fonts/Poppins-ExtraBold.ttf') format('truetype');font-weight:800;font-display:swap}
  @font-face{font-family:'Nunito Sans';src:url('site-assets/fonts/NunitoSans-VariableFont_YTLC_opsz_wdth_wght.ttf') format('truetype-variations');font-weight:300 900;font-display:swap}
  :root{
    --paper:#FBF4EA;--ink:#171412;--orange:#F15A29;--blue:#0076CE;--yellow:#FFD54F;
    --midgray:#6B6359;--warmgray:#9B9284;--mist:#F1E7DB;--white:#fff;
    --h:'Poppins',sans-serif;--b:'Nunito Sans',sans-serif;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--paper);color:var(--ink);font-family:var(--b);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  .card{width:100%;max-width:424px;background:var(--white);border:1px solid rgba(28,28,28,.08);border-radius:24px;padding:42px 36px 30px;box-shadow:0 30px 70px -30px rgba(23,20,18,.42);text-align:center}
  .logo{height:30px;width:auto;margin:0 auto 24px;display:block}
  .dots{display:flex;gap:7px;justify-content:center;margin-bottom:22px}
  .dots i{width:8px;height:8px;border-radius:50%;display:inline-block}
  .dots i:nth-child(1){background:var(--blue)}
  .dots i:nth-child(2){background:var(--orange)}
  .dots i:nth-child(3){background:var(--yellow)}
  h1{font-family:var(--h);font-weight:800;font-size:26px;letter-spacing:-.025em;margin-bottom:10px}
  .sub{font-size:15.5px;color:var(--midgray);line-height:1.55;margin-bottom:26px}
  form{display:flex;flex-direction:column;gap:13px;text-align:left}
  label{font-family:var(--h);font-weight:600;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--warmgray)}
  .field{display:flex;flex-direction:column;gap:6px}
  input{font-family:var(--b);font-size:16px;padding:13px 15px;border:1.5px solid var(--mist);border-radius:12px;background:var(--paper);color:var(--ink);outline:none;transition:border-color .15s,background .15s;width:100%}
  input:focus{border-color:var(--blue);background:#fff}
  button{margin-top:6px;font-family:var(--h);font-weight:600;font-size:16px;color:#fff;background:var(--orange);border:none;border-radius:12px;padding:15px;cursor:pointer;box-shadow:0 10px 26px rgba(241,90,41,.26);transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease}
  button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 16px 34px rgba(241,90,41,.32)}
  button:disabled{opacity:.65;cursor:default}
  .err{color:var(--orange);font-size:13.5px;min-height:18px;line-height:1.4}
  .foot{margin-top:24px;font-size:12px;letter-spacing:.02em;color:var(--warmgray)}
  @media(prefers-reduced-motion:reduce){button{transition:none}}
</style>
</head>
<body>
  <main class="card">
    <img class="logo" src="site-assets/helloboe_logo_horizontal_black.png" alt="HelloBoe">
    <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
    <h1>Private preview</h1>
    <p class="sub">HelloBoe is invite only while we get ready. Enter the password to continue.</p>
    <form id="gate-form" autocomplete="off" novalidate>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••••" required autofocus>
      </div>
      <div class="err" id="err" role="alert" aria-live="polite"></div>
      <button id="btn" type="submit">Enter site</button>
    </form>
    <p class="foot">© ${new Date().getUTCFullYear()} HelloBoe · Confidential</p>
  </main>

<script>
(function(){
  // The site is not hidden, it is encrypted. CT below is the whole page under
  // AES-256-GCM; the key is derived from the password with PBKDF2-SHA256 at
  // ${PBKDF2_ITERATIONS.toLocaleString('en-US')} iterations, which is what makes guessing expensive.
  // GCM is authenticated, so a wrong password fails to decrypt rather than
  // producing garbage, and tampered ciphertext is rejected outright.
  var ITER = ${PBKDF2_ITERATIONS};
  var SALT = "${b64(salt)}";
  var IV   = "${b64(iv)}";
  var CT   = "${b64(cipherBuf)}";

  function b64ToBuf(b64){
    var bin = atob(b64), len = bin.length, buf = new Uint8Array(len);
    for (var i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }

  // The decrypted document is held in memory only and never written to Web
  // Storage, so closing the tab or reloading re-prompts. That is deliberate:
  // a shared laptop should not leave the preview open behind you.
  //
  // document.write is safe here. The payload is our own content, its integrity
  // is guaranteed by GCM (tampering fails the decrypt), it is never
  // attacker-controlled, and its inline script has to execute.
  function render(html){
    document.open(); document.write(html); document.close();
  }

  async function decrypt(pw){
    var baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64ToBuf(SALT), iterations: ITER, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(IV) }, key, b64ToBuf(CT));
    return new TextDecoder().decode(ptBuf);
  }

  function onReady(){
    var form = document.getElementById('gate-form');
    var pwEl = document.getElementById('password');
    var errEl = document.getElementById('err');
    var btn = document.getElementById('btn');

    // crypto.subtle only exists in secure contexts. Say so plainly rather
    // than throwing an opaque error on submit.
    if (!window.crypto || !crypto.subtle) {
      errEl.textContent = 'This page needs a secure (https) connection.';
      btn.disabled = true;
      return;
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      errEl.textContent = '';
      var pw = pwEl.value || '';
      if (!pw) { errEl.textContent = 'Enter the password.'; return; }
      btn.disabled = true; btn.textContent = 'Unlocking…';
      try {
        render(await decrypt(pw));
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Enter site';
        errEl.textContent = 'Incorrect password. Please try again.';
        pwEl.value = ''; pwEl.focus();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
</script>
</body>
</html>
`;

const target = resolve(REPO, 'staging/index.html');
if (DRY_RUN) {
  log(`dry run: would write ${target} (${(Buffer.byteLength(gate) / 1024).toFixed(0)} KB)`);
} else {
  writeFileSync(target, gate, 'utf8');
  log(`wrote staging/index.html (${(Buffer.byteLength(gate) / 1024).toFixed(0)} KB)`);
}

console.log('\n  Done.\n');
