import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { routes } from '../shared/app';
import { mountHarnessScripts } from '../shared/harness';

mountHarnessScripts({ id: 'B2', label: 'B2 · SPA hash router' });

// Hash routing: the document path stays /b2-spa/, only location.hash changes
// (#/pricing). The browser fires native `hashchange` — nav-probe logs it, but
// the widget still does not re-/load (doc Appendix C3).
const router = createHashRouter(routes);

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
