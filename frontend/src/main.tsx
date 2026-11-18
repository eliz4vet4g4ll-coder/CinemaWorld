import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { USE_MOCK } from './api/client';

async function start() {
  if (USE_MOCK) {
    const { applyScenarioFromUrl } = await import('./mock/server');
    applyScenarioFromUrl(window.location.search);
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
