import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '@/styles/globals.css';

async function enableMocking() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('@/mocks/browser');

      // Start the worker with proper configuration
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });

      console.log('[MSW] Mocking enabled');
    } catch (error) {
      console.error('[MSW] Failed to enable mocking:', error);
    }
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
