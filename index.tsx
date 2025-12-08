import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

declare const __BUILD_VERSION__: string;

if ('serviceWorker' in navigator) {
  const version = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : Date.now().toString();
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${version}`)
      .then(() => {
        let hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hadController) {
            window.dispatchEvent(new CustomEvent('sw-update'));
          }
          hadController = true;
        });
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            window.dispatchEvent(new CustomEvent('sw-update'));
          }
        });
      })
      .catch(() => {});
  });
}

window.addEventListener('sw-update', () => {
  // React component handles the UI for updates
});
