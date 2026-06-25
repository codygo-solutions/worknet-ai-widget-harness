import HarnessShell from './_components/HarnessShell';
import RuntimeConfigGate from './_components/RuntimeConfigGate';

const SECTIONS = [
  {
    code: 'A',
    href: '/a-mpa',
    name: 'Classic MPA (WordPress/Webflow/HubSpot/AEM)',
    tag: 'full-load',
  },
  { code: 'B1', href: '/b1-spa/', name: 'SPA · HTML5 history', tag: 'soft-nav' },
  { code: 'B2', href: '/b2-spa/', name: 'SPA · hash router', tag: 'soft-nav' },
  { code: 'C·app', href: '/c-hybrid', name: 'Hybrid SSR — App Router (RSC)', tag: 'SSR→soft' },
  { code: 'C·pg', href: '/c-pages', name: 'Hybrid SSR — Pages Router', tag: 'SSR→soft' },
  { code: 'D', href: '/d-docs', name: 'Docs SPA (Docusaurus/Mintlify-shaped)', tag: 'SSR→soft' },
  { code: 'E', href: '/e-auth/login', name: 'Auth-gated app (login → shell)', tag: 'mixed' },
  { code: 'F', href: '/f-mfe/', name: 'Micro-frontend shell (single-spa)', tag: 'soft-nav' },
  { code: 'G', href: '/g-turbo', name: 'Turbo/htmx MPA-as-soft-nav (trap)', tag: 'soft-nav' },
  {
    code: 'H',
    href: '/h-hostile',
    name: 'Hostile host (strict CSP + competing widget)',
    tag: 'varies',
  },
  {
    code: 'I',
    href: '/i-dom-automation',
    name: 'DOM automation testbed (hostile DOM patterns)',
    tag: 'automation',
  },
] as const;

export default function DirectoryPage(): React.JSX.Element {
  return (
    <main className="wrap">
      <HarnessShell sectionId="DIR" sectionLabel="Section directory" />
      <h1 className="title">Widget Tenant-Site Simulator</h1>
      <p className="sub">
        Each section embeds the real chat/AI widget exactly as an external customer would. Open the
        nav-probe (bottom-right) and watch the Expected-vs-Actual table per the doc §7 matrix.
      </p>
      <RuntimeConfigGate />
      <ul className="sections">
        {SECTIONS.map((s) => (
          <li key={s.code}>
            <a href={s.href}>
              <span className="code">{s.code}</span>
              <span className="name">{s.name}</span>
              <span className="tag">{s.tag}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="note">
        Soft-nav archetypes (B1–G) render <code>✗</code> on the journey-signal and AI-helper rows:
        the widget has no History instrumentation, so it emits no new <code>/load</code> on in-app
        navigation. When the separate widget History fix lands, those cells flip green with this
        harness unchanged.
      </p>
    </main>
  );
}
