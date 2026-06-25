'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import HarnessShell from '../../_components/HarnessShell';

// The authenticated shell — a long-lived history-routed client section.
// Guards on the mock token; if absent, bounce to the login document.
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element | null {
  const [authed, setAuthed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const ok = !!window.localStorage.getItem('wn-harness:e-auth-token');
    if (!ok) {
      window.location.replace('/e-auth/login');
      return;
    }
    setAuthed(true);
  }, []);

  if (!authed) return null;

  return (
    <div className="wrap">
      <HarnessShell sectionId="E" sectionLabel="E · Auth-gated (shell)" />
      <p className="crumb">authenticated client shell · history-routed</p>
      <nav
        style={{
          display: 'flex',
          gap: 16,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        <strong>Acme App</strong>
        <Link href="/e-auth/app">Dashboard</Link>
        <Link href="/e-auth/app/billing">Billing</Link>
        <Link href="/e-auth/app/settings">Settings</Link>
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem('wn-harness:e-auth-token');
            window.location.assign('/e-auth/login');
          }}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 0,
            color: '#2563eb',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </nav>
      {children}
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 28 }}>
        The widget loaded pre-auth on the login document, re-loaded on the full-nav into this shell
        (re-identify), and now every in-shell <code>&lt;Link&gt;</code> is a soft-nav → journey{' '}
        <strong>✗(now)</strong>.
      </p>
    </div>
  );
}
