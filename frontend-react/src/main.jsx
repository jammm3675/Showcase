import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import './index.css'
import App from './App.jsx'

// The manifest is placed in the public directory, but we will fetch it via the API to avoid proxy issues.
const manifestUrl = '/api/tonconnect-manifest.json';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
)
