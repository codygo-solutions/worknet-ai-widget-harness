import Link from 'next/link';

import CspReportMonitor from './CspReportMonitor';

export default function HHostilePage(): React.JSX.Element {
  return (
    <main className="wrap">
      <p className="crumb">
        strict header CSP · nonce script-src · strict-dynamic · connect-src allowlist ·
        frame-ancestors none · report-uri
      </p>
      <h1>Hostile host</h1>
      <p>
        This page ships a strict, header-delivered Content-Security-Policy (per-request nonce, no{' '}
        <code>unsafe-inline</code> scripts), a pre-existing competing widget, and aggressive global
        CSS that would bleed into a non-Shadow-DOM widget.
      </p>
      <CspReportMonitor />
      <ul>
        <li>
          Widget still loads: the nonced bootstrap is the only trusted root;
          <code> strict-dynamic</code> lets it inject the embed.
        </li>
        <li>
          Socket.IO / ingest work because <code>connect-src</code> is allowlisted from the same
          runtime config the browser embed uses.
        </li>
        <li>
          Shadow DOM blocks <code>host-bleed.css</code> — the widget UI is unaffected while this
          page&apos;s own chrome is mangled.
        </li>
        <li>The competing widget (Pendo/Beamer-shaped) coexists — two launchers, no collision.</li>
        <li>
          <strong>H requires <code>public/widget-runtime.json</code></strong>: its server-built CSP
          allowlist derives only from that file — <code>?api=</code>/<code>?chat=</code>/
          <code>localStorage</code> embed overrides are not visible server-side, so a widget
          pointed elsewhere via query/localStorage would be CSP-blocked here.
        </li>
      </ul>
      <p>
        <Link href="/h-hostile/secondary">One in-app soft link →</Link> (App Router soft-nav; after
        this, the same ✗(now) journey regression as every soft-nav archetype).
      </p>
      <a href="/">← directory (hard nav)</a>
    </main>
  );
}
