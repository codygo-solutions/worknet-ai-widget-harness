import Link from 'next/link';

import HarnessShell from '../_components/HarnessShell';

export const metadata = {
  title: 'Acme Cloud — Hybrid SSR (App Router)',
};

// Real Next App Router route group: genuine server render + RSC streaming
// (self.__next_f flight payload, /_next/ assets, Vary: RSC — the middleware
// reinforces the Vary fingerprint). <Link> navigation is real client soft-nav.
export default function CHybridLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="wrap">
      <HarnessShell sectionId="C-app" sectionLabel="C · Hybrid App Router (RSC)" />
      <p className="crumb">App Router · RSC · real /_next/ · Vary: RSC</p>
      <nav
        style={{
          display: 'flex',
          gap: 16,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        <strong>Acme Cloud</strong>
        <Link href="/c-hybrid">Home</Link>
        <Link href="/c-hybrid/pricing">Pricing</Link>
        <Link href="/c-hybrid/solutions/logistics">Solutions</Link>
        <a href="/" style={{ marginLeft: 'auto' }}>
          ← directory (hard nav)
        </a>
      </nav>
      {children}
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 28 }}>
        First load is real SSR/RSC. Each <code>&lt;Link&gt;</code> click is an App-Router soft-nav
        (client <code>history.pushState</code>, no full load) — the widget keeps stale context and
        emits no new <code>/load</code> → journey <strong>✗(now)</strong>.
      </p>
    </div>
  );
}
