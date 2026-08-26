import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

/**
 * Build-time render for the PUBLIC site (see build-staging.mjs --public).
 *
 * The launched page used to ship an empty <div id="root"> that stayed empty,
 * and unscrollable, until the whole JS bundle had downloaded and executed.
 * This renders the same tree to HTML at build time so the full page exists
 * from the first byte; main.tsx then hydrates it instead of re-rendering.
 *
 * Must stay markup-identical to what main.tsx mounts, or hydration will
 * mismatch. Both wrap <App /> in <StrictMode> for exactly that reason.
 */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
