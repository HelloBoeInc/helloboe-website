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
  ReactDOM.hydrateRoot(container, app)
} else {
  ReactDOM.createRoot(container).render(app)
}
