'use client';

import { useEffect, useState } from 'react';

type Status = { state: 'loading' } | { state: 'ok'; wk: string } | { state: 'missing' };

// Header strip on the directory: shows whether a usable runtime config is
// present. It never blocks rendering — a missing widgetKey only means the
// widget won't load; the nav-probe surfaces the same error in detail.
export default function RuntimeConfigGate(): React.JSX.Element {
  const [status, setStatus] = useState<Status>({ state: 'loading' });

  useEffect(() => {
    async function read(name: string): Promise<Record<string, string> | undefined> {
      const res = await fetch(`/${name}`, { cache: 'no-store' }).catch(() => undefined);
      if (!res?.ok) return undefined;
      return (await res.json().catch(() => undefined)) as Record<string, string> | undefined;
    }
    function readStored(): Record<string, string> {
      try {
        const raw = window.localStorage.getItem('wn-harness:runtime-config');
        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
      } catch {
        return {};
      }
    }
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const live = (await read('widget-runtime.json')) ?? {};
      // Same precedence as embed-bootstrap.js: query > localStorage > json,
      // so the strip reflects a key a prior visit persisted via ?wk=.
      const stored = readStored();
      const wk = params.get('wk') ?? stored.widgetKey ?? live.widgetKey;
      if (wk && !/^REPLACE_WITH/.test(wk)) {
        setStatus({ state: 'ok', wk });
      } else {
        setStatus({ state: 'missing' });
      }
    })();
  }, []);

  if (status.state === 'loading') {
    return <span className="rc rc-wait">runtime: checking…</span>;
  }
  if (status.state === 'missing') {
    return <span className="rc rc-bad">runtime: no widgetKey — see README / pass ?wk=wk_…</span>;
  }
  const shortKey = status.wk.length > 10 ? `${status.wk.slice(0, 8)}…` : status.wk;
  return <span className="rc rc-ok">runtime: {shortKey} · OK</span>;
}
