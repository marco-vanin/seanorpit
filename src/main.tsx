import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from '@/app/app'
import { applyTheme, readTheme } from '@/features/settings/utils/theme-mode'

// Apply the saved theme to <html> before rendering, so there is no flash of the
// wrong palette on load.
applyTheme(readTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
