import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import HarnessShell from '../app/_components/HarnessShell';
import { getWnHarness } from '../app/_components/wnHarness';

// Pages-Router shell. Router.events is the Pages-Router navigation model
// (App Router has no router.events) — subscribing here is itself part of the
// fingerprint. The widget still has no History instrumentation, so soft-nav
// produces no new /load regardless of which router model fired.
export default function App({ Component, pageProps }: AppProps): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    function onDone(): void {
      const h = getWnHarness() as { pagesRouterEvents?: number };
      h.pagesRouterEvents = (h.pagesRouterEvents ?? 0) + 1;
    }
    router.events.on('routeChangeComplete', onDone);
    return () => router.events.off('routeChangeComplete', onDone);
  }, [router.events]);

  return (
    <>
      <HarnessShell sectionId="C-pages" sectionLabel="C · Hybrid Pages Router" />
      <Component {...pageProps} />
    </>
  );
}
