import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { routes } from '../shared/app';
import { mountHarnessScripts } from '../shared/harness';

mountHarnessScripts({ id: 'B1', label: 'B1 · SPA HTML5 history' });

// Absolute base path on the server (next.config rewrite serves index.html for
// any /b1-spa/* deep link); react-router owns the in-app routing via raw
// history.pushState — no nav event on link click (doc Appendix C2).
const router = createBrowserRouter(routes, { basename: '/b1-spa' });

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
