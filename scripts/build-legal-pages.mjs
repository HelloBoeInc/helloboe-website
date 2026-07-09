#!/usr/bin/env node
/**
 * build-legal-pages.mjs — generate the hosted legal pages (privacy / terms /
 * disclaimer) from the VERBATIM counsel text, for helloboe.com.
 *
 * Why a generator (not hand-transcription): the hosted pages must be byte-for-
 * byte identical to the text a parent assents to in the app. That text is the
 * app repo's src/content/legal/{privacy,terms,disclaimer}.json — itself
 * generated verbatim from counsel's 06-30 .docx. We vendor those JSON files
 * (legal/source/*.json, hash-checked against the app repo) and render them to
 * static HTML so the fidelity is guaranteed by construction, then round-trip
 * verified (extract text back out of the HTML, assert it equals the source).
 *
 * The pages are intentionally UN-discoverable pre-launch:
 *   - <meta name="robots" content="noindex, nofollow"> on every page
 *   - a root robots.txt Disallows /privacy, /terms, /disclaimer
 *   - NOTHING links to them (not index.html, not staging/, no sitemap)
 * They remain fully readable at the direct URL with no auth — which is exactly
 * what Apple review + Google's crawler need, and all a store submission wants.
 *
 * Usage:
 *   node scripts/build-legal-pages.mjs           # generate + verify
 *   node scripts/build-legal-pages.mjs --check    # verify only (no write)
 *
 * To update when counsel issues new text: re-run the app repo's
 * scripts/build-legal-assets.mjs, copy the 3 refreshed JSON into legal/source/
 * (hashes must match the app repo), then re-run this. See legal/README.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const SRC = resolve(REPO, 'legal/source');

const DOCS = ['privacy', 'terms', 'disclaimer'];
const CHECK_ONLY = process.argv.includes('--check');

/** Escape ONLY the three characters that must be escaped in element content.
 *  Order matters (& first). Everything else — curly quotes, em dashes, the
 *  https://helloboe.com/ URLs — stays raw UTF-8 so the rendered text is
 *  byte-identical to the source. */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/** Exact inverse of esc(), for the round-trip verification. */
function unesc(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** Shared page shell — matches the site (index.html): --sand background,
 *  Poppins + Nunito Sans, --black ink. Long-form-readable, link-free. */
function renderPage(doc) {
  const title = esc(doc.title);
  const revised = esc(doc.lastRevised);
  const version = esc(doc.consentVersion);
  // One block per line so the round-trip extractor can parse deterministically.
  const body = doc.blocks
    .map((b) =>
      b.type === 'heading'
        ? `      <h2>${esc(b.text)}</h2>`
        : `      <p>${esc(b.text)}</p>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${title} — HelloBoe</title>
<meta name="description" content="${title} for HelloBoe, Inc.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;1,6..12,400&display=swap" rel="stylesheet">
<style>
  :root {
    --sand: #FBF4EA;
    --blue: #0076CE;
    --orange: #F15A29;
    --black: #1C1C1C;
    --white: #FFFFFF;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--sand);
    color: var(--black);
    font-family: 'Nunito Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── HEADER ── */
  header {
    padding: 28px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(28, 28, 28, 0.08);
  }
  .header-logo img { height: 26px; width: auto; display: block; }
  .header-email {
    font-size: 13px;
    font-weight: 500;
    color: var(--black);
    opacity: 0.4;
    text-decoration: none;
    letter-spacing: 0.01em;
    transition: opacity 0.3s;
  }
  .header-email:hover { opacity: 0.8; }

  /* ── DOCUMENT ── */
  .doc {
    max-width: 720px;
    margin: 0 auto;
    padding: 56px 24px 96px;
  }
  .doc-title {
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: clamp(28px, 5vw, 40px);
    letter-spacing: -0.01em;
    line-height: 1.15;
    color: var(--black);
  }
  .doc-meta {
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: var(--black);
    opacity: 0.5;
    margin-top: 12px;
  }
  .doc-rule {
    height: 3px;
    width: 48px;
    background: var(--orange);
    border-radius: 2px;
    margin: 24px 0 8px;
  }

  .doc h2 {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 0.01em;
    color: var(--black);
    margin: 40px 0 14px;
  }
  .doc p {
    font-size: 16px;
    line-height: 1.7;
    color: var(--black);
    opacity: 0.85;
    margin-bottom: 18px;
  }
  .doc p:last-child { margin-bottom: 0; }

  /* ── FOOTER ── */
  footer {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 24px 56px;
    border-top: 1px solid rgba(28, 28, 28, 0.08);
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    align-items: center;
    justify-content: space-between;
  }
  .footer-copy {
    font-size: 13px;
    color: var(--black);
    opacity: 0.45;
  }
  .footer-email {
    font-size: 13px;
    font-weight: 500;
    color: var(--black);
    opacity: 0.5;
    text-decoration: none;
  }
  .footer-email:hover { opacity: 0.85; }

  @media (max-width: 640px) {
    header { padding: 20px 20px; }
    .doc { padding: 40px 20px 72px; }
  }
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
    <h1 class="doc-title">${title}</h1>
    <p class="doc-meta">HelloBoe, Inc.&nbsp;&nbsp;·&nbsp;&nbsp;Last revised ${revised}&nbsp;&nbsp;·&nbsp;&nbsp;v${version}</p>
    <div class="doc-rule"></div>
${body}
  </main>

  <footer>
    <div class="footer-copy">&copy; 2026 HelloBoe, Inc. All rights reserved.</div>
    <a href="mailto:support@helloboe.com" class="footer-email">support@helloboe.com</a>
  </footer>

</body>
</html>
`;
}

/** Re-extract the legal text from generated HTML and assert byte-identity with
 *  the source JSON blocks. This is the Rule #14 proof that the page is verbatim. */
function extractBlocks(html) {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const blocks = [];
  for (const line of main.split('\n')) {
    const h = line.match(/^\s*<h2>(.*)<\/h2>\s*$/);
    const p = line.match(/^\s*<p>(.*)<\/p>\s*$/);
    if (h) blocks.push({ type: 'heading', text: unesc(h[1]) });
    else if (p) blocks.push({ type: 'body', text: unesc(p[1]) });
  }
  return blocks;
}

function sha256(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

let failed = false;
for (const key of DOCS) {
  const doc = JSON.parse(readFileSync(resolve(SRC, `${key}.json`), 'utf8'));
  const html = renderPage(doc);
  const outDir = resolve(REPO, key);
  const outFile = resolve(outDir, 'index.html');

  if (!CHECK_ONLY) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, html);
  }

  // Verify against whatever will actually be served: re-read the written file
  // in generate mode, or the freshly rendered string in --check mode.
  const served = CHECK_ONLY ? html : readFileSync(outFile, 'utf8');
  const extracted = extractBlocks(served);

  const srcText = doc.blocks.map((b) => `${b.type} ${b.text}`).join('\n');
  const outText = extracted.map((b) => `${b.type} ${b.text}`).join('\n');
  const ok =
    extracted.length === doc.blocks.length && sha256(srcText) === sha256(outText);

  const tag = ok ? 'PASS' : 'FAIL';
  if (!ok) failed = true;
  console.log(
    `${tag}  ${key.padEnd(10)}  blocks src=${doc.blocks.length} html=${extracted.length}  ` +
      `sha256(text) src=${sha256(srcText).slice(0, 16)} html=${sha256(outText).slice(0, 16)}  ` +
      `lastRevised="${doc.lastRevised}" v${doc.consentVersion}`,
  );
}

if (failed) {
  console.error('\nVERBATIM CHECK FAILED — rendered text does not match source JSON.');
  process.exit(1);
}
console.log(`\n${CHECK_ONLY ? 'Verified' : 'Generated + verified'} 3 legal pages — verbatim match confirmed.`);
