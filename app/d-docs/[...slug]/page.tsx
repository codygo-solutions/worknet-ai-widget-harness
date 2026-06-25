// Catch-all docs route. Next 15 — params are async.
export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  const path = (slug ?? []).join('/');
  return (
    <article>
      <h1>{path || 'Docs'}</h1>
      <p>
        Doc page <code>/d-docs/{path}</code>. You arrived by instant client soft-nav (or a direct
        server render on hard load). The nav-probe shows soft-navs rising with no new widget{' '}
        <code>/load</code>.
      </p>
      <h2>Embedding</h2>
      <p>
        Add <code>window.__WorknetWidget</code> then the embed script — exactly what every section
        here does.
      </p>
    </article>
  );
}
