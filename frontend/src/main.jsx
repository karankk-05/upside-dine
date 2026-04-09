import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import { configureAxiosAuth } from './lib/auth';
import './index.css';

configureAxiosAuth(axios);

const rootElement = document.getElementById('root');
const bootSplash = document.getElementById('app-boot-splash');

const dismissBootSplash = () => {
  if (!bootSplash) {
    return;
  }

  bootSplash.classList.add('app-boot-splash--hidden');
  window.setTimeout(() => {
    bootSplash.remove();
  }, 260);
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(dismissBootSplash);
});
