import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './app.jsx'
import { applyTheme, getStoredTheme } from './libs/theme.js'

applyTheme(getStoredTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
