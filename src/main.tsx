import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Gracefully transition away native splash screen
if (typeof window !== 'undefined') {
  const splash = document.getElementById('pwa-splash');
  if (splash) {
    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
      }, 350);
    }, 450);
  }
}
