import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')!
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// The public build ships #root pre-rendered by entry-server.tsx, so React must
// adopt that HTML rather than throw it away and rebuild it. The gated /staging
// build and the dev server still start from an empty div.
if (container.hasChildNodes()) {
  // Hydration is synchronous main-thread work, and on a phone it lands at the
  // exact moment the reader first tries to scroll. The pre-rendered page needs
  // no JavaScript to read or scroll, so let the browser commit a frame and
  // process that first gesture, then attach React: two rAFs guarantee a paint
  // has happened, and idle time (with a hard 1.5s ceiling so the menu never
  // stays dead for long) yields to any in-flight scroll handling first.
  const hydrate = () => ReactDOM.hydrateRoot(container, app)
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(hydrate, { timeout: 1500 })
      } else {
        setTimeout(hydrate, 50)
      }
    }),
  )
} else {
  ReactDOM.createRoot(container).render(app)
}
