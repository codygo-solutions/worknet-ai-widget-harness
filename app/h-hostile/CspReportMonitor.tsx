'use client';

import { useEffect, useState } from 'react';

// H-specific visibility (the shared nav-probe stays generic): polls the CSP
// report sink so "did the strict CSP block the widget?" is answerable on-page.
// Target: 0 reports + the widget's onReady fired = loaded cleanly under CSP.
export default function CspReportMonitor(): React.JSX.Element {
  const [total, setTotal] = useState<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    async function poll(): Promise<void> {
      const res = await fetch('/h-hostile/csp-report', {
        cache: 'no-store',
      }).catch(() => undefined);
      if (!alive || !res?.ok) return;
      const data = (await res.json().catch(() => undefined)) as { total: number } | undefined;
      if (data) setTotal(data.total);
    }
    // Clear the server-side ring first so this H session's "0 = clean"
    // signal is not poisoned by violations from a prior run in the same
    // server process; only then start polling.
    void fetch('/h-hostile/csp-report', { method: 'DELETE' })
      .catch(() => undefined)
      .then(() => poll());
    const id = setInterval(poll, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const clean = total === 0;
  return (
    <p
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
        padding: '8px 12px',
        borderRadius: 6,
        background: clean ? '#f0fdf4' : '#fef2f2',
        color: clean ? '#15803d' : '#b91c1c',
        border: `1px solid ${clean ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      CSP violation reports: <strong>{total ?? '…'}</strong>
      {clean
        ? ' — widget loaded cleanly under strict CSP (script-src nonce + strict-dynamic, connect-src allowlisted).'
        : ' — inspect /h-hostile/csp-report; a non-zero count means something was blocked.'}
    </p>
  );
}
