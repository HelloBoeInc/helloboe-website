import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Build config for the HelloBoe marketing site. Two modes:
 *
 * GATED (default) — the output has to be a SINGLE self-contained HTML file,
 * because it gets AES-GCM encrypted and rendered from memory behind the
 * /staging password gate. A page that fetched separate .js / .css / .png
 * files would be publishing its own content unencrypted next to the gate
 * that hides it. assetsInlineLimit is therefore set absurdly high so Vite
 * inlines every image and font as a data: URI, and build-staging.mjs folds
 * the emitted JS and CSS into the HTML itself.
 *
 * PUBLIC (HB_PUBLIC=1, set by build-staging.mjs --public) — the launched
 * site at the root has no gate, so the single-file trade-off inverts: a
 * ~1 MB monolithic document meant nothing painted until ALL of it had
 * downloaded and executed, which is a very slow first load on a phone.
 * Public builds are a normal multi-file build: hashed, cacheable assets
 * under site-assets/bundle/, images fetched in parallel (many are
 * loading="lazy"), and a small initial document.
 */
const PUBLIC = process.env.HB_PUBLIC === '1'

export default defineConfig({
  // Public builds use an ABSOLUTE base. With './', Vite resolves asset URLs
  // at runtime from document.currentScript — which is always null inside the
  // type="module" tag it emits, so the fallback (document.baseURI) pointed
  // every image at the site root and they all 404ed. '/' bakes literal
  // /site-assets/bundle/... URLs into the bundle instead; correct because the
  // launched site is served at the domain root. The gated build keeps './' —
  // everything is inlined as data: URIs there, so no URL is ever resolved.
  base: PUBLIC ? '/' : './',
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: PUBLIC ? 4096 : 100_000_000,
    // The public bundle dir is wholly owned by the build script: it wipes and
    // repopulates REPO/site-assets/bundle on every --public run.
    assetsDir: PUBLIC ? 'site-assets/bundle' : 'assets',
    cssCodeSplit: false,
    sourcemap: false,
    // Terser squeezes noticeably more out of a bundle that is mostly one
    // large component than esbuild does.
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2 },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        // One chunk. Nothing to code-split on a single-page site, and the
        // build script expects exactly one JS and one CSS entry.
        manualChunks: undefined,
        inlineDynamicImports: true,
        // IIFE, not ESM, and this is load-bearing rather than a preference.
        // The gate renders the decrypted page with document.write(). A
        // classic script inserted that way runs reliably in every browser;
        // a type="module" script is deferred and its behaviour after
        // document.open()/write()/close() is far less certain. Since the
        // bundle has no imports left to resolve once everything is inlined,
        // there is nothing to give up by dropping modules.
        format: 'iife',
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 5173 },
})
