import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '@/styles/globals.css';

async function enableMocking() {
  // Only enable mocking if VITE_ENABLE_MOCK is explicitly set to 'true'
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    try {
      const { worker } = await import('@/mocks/browser');

      // Start the worker with proper configuration
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });

      import.meta.env.DEV && console.log('[MSW] Mocking enabled');
    } catch (error) {
      console.error('[MSW] Failed to enable mocking:', error);
    }
  } else {
    import.meta.env.DEV && console.log('[API] Using real backend APIs at', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
