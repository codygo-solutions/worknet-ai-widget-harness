// Catch-all docs route. Next 15 — params are async.
const DOCS: Record<
  string,
  {
    title: string;
    summary: string;
    steps: string[];
    helperTarget: string;
  }
> = {
  'getting-started': {
    title: 'Getting started',
    summary: 'Create a workspace, invite a teammate, and verify that the widget is visible.',
    steps: ['Create a Worknet app', 'Copy the widget key', 'Install the embed script'],
    helperTarget: 'onboarding checklist',
  },
  'guides/install': {
    title: 'Install',
    summary: 'Add the script tag to a CMS, tag manager, or bundled app entrypoint.',
    steps: ['Choose an environment', 'Paste the script before </body>', 'Verify CSP and network access'],
    helperTarget: 'install troubleshooting',
  },
  'guides/embedding': {
    title: 'Embedding the widget',
    summary: 'Configure grouping, host context, and optional API/chat URL overrides.',
    steps: ['Set window.__WorknetWidget', 'Provide groupingId', 'Attach customContext'],
    helperTarget: 'embed configuration',
  },
  'api/reference': {
    title: 'API reference',
    summary: 'Methods exposed through the captured widget API after onReady fires.',
    steps: ['open()', 'close()', 'submitUserMessage({ text })'],
    helperTarget: 'widget API methods',
  },
};

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  const path = (slug ?? []).join('/');
  const doc = DOCS[path] ?? {
    title: path || 'Docs',
    summary: 'Unknown docs page. Direct loads still server-render; in-app docs links soft-nav.',
    steps: ['Use the sidebar', 'Watch the nav-probe', 'Compare loaded URL with current path'],
    helperTarget: 'fallback docs page',
  };
  return (
    <article data-ai-helper-scope={doc.helperTarget}>
      <h1>{doc.title}</h1>
      <p>
        Doc page <code>/d-docs/{path || 'getting-started'}</code>. You arrived by instant client soft-nav (or a direct
        server render on hard load). The nav-probe shows soft-navs rising with no new widget{' '}
        <code>/load</code>.
      </p>
      <p>{doc.summary}</p>
      <h2>Checklist</h2>
      <ol>
        {doc.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <aside
        data-ai-helper="true"
        style={{ border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, background: '#eff6ff' }}
      >
        AI-helper target: <strong>{doc.helperTarget}</strong>. This marker changes per docs route.
      </aside>
    </article>
  );
}
