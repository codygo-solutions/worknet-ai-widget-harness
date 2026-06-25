import Link from 'next/link';

import HarnessShell from '../_components/HarnessShell';

// Docs-platform fingerprints (doc Appendix B). Native Next route styled as a
// docs site with instant client soft-nav.
export const metadata = {
  generator: 'Docusaurus 3.6.0',
  title: 'Acme Docs',
  other: { 'docsearch:language': 'en' },
};

const DOC_PAGES = [
  ['getting-started', 'Getting started'],
  ['guides/install', 'Install'],
  ['guides/embedding', 'Embedding the widget'],
  ['api/reference', 'API reference'],
];

export default function DocsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="docshell" id="__docusaurus">
      <HarnessShell sectionId="D" sectionLabel="D · Docs SPA (Docusaurus-shaped)" />
      <aside className="docnav">
        <input
          type="search"
          placeholder="Search ⌘K"
          aria-label="Search docs"
          className="DocSearch-Input"
          style={{
            width: '100%',
            padding: '6px 8px',
            marginBottom: 14,
            border: '1px solid #e2e8f0',
            borderRadius: 6,
          }}
        />
        {DOC_PAGES.map(([slug, label]) => (
          <Link key={slug} href={`/d-docs/${slug}`}>
            {label}
          </Link>
        ))}
        <a href="/" style={{ marginTop: 18, color: '#64748b' }}>
          ← directory (hard nav)
        </a>
      </aside>
      <main className="docmain">
        <p className="crumb">generator: Docusaurus · __docusaurus · DocSearch</p>
        {children}
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 28 }}>
          Docs platforms use instant client nav. The AI-helper found selectors on the first page;
          after a soft-nav it is <strong>not re-scanned</strong> → AI-helper row ✗(now).
        </p>
      </main>
    </div>
  );
}
