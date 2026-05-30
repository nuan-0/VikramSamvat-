/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register basic service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // using import.meta.env.BASE_URL handles subdirectory deployments correctly
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {});
  });
}
