import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Build config for the HelloBoe marketing site.
 *
 * The output has to be a SINGLE self-contained HTML file, because it gets
 * AES-GCM encrypted and rendered from memory behind the /staging password
 * gate. A page that fetched separate .js / .css / .png files would be
 * publishing its own content unencrypted next to the gate that hides it.
 *
 * assetsInlineLimit is therefore set absurdly high so Vite inlines every
 * image and font as a data: URI. scripts/build-staging.mjs then folds the
 * emitted JS and CSS into the HTML itself.
 *
 * Cost of this: no per-asset browser caching. That is the right trade for a
 * one-page site whose assets total well under a megabyte, and it means the
 * page also works identically at /staging today and at the site root after
 * launch, with no path rewriting.
 */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: 100_000_000,
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
