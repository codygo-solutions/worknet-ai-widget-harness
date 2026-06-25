export default function DocsHome(): React.JSX.Element {
  return (
    <article>
      <h1>Acme Docs</h1>
      <p>
        A docs site shaped like Docusaurus/Mintlify (generator meta,
        <code> __docusaurus</code> root, DocSearch box). Pick a page in the sidebar — navigation is
        instant client-side soft-nav, no full reload.
      </p>
      <p>
        This is the archetype where the AI-helper regression is most visible: a help widget scans
        the docs DOM once, then never re-scans as the reader moves between pages.
      </p>
    </article>
  );
}
