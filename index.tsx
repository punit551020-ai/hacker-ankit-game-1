/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline capabilities and mobile PWA installability
try {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      console.log('[PWA] Service Worker registered via vite-plugin-pwa:', registration?.scope);
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed via vite-plugin-pwa, falling back to navigator.serviceWorker:', error);
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
          .then((reg) => console.log('[PWA] Fallback Service Worker registered:', reg.scope))
          .catch((err) => console.error('[PWA] Fallback registration error:', err));
      }
    }
  });
} catch (e) {
  // Direct fallback
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => console.log('[PWA] Native Service Worker registered:', reg.scope))
        .catch((err) => console.warn('[PWA] Native Service Worker error:', err));
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);