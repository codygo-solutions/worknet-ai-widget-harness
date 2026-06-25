// Server component — forced dynamic so the timestamp proves a real server
// render on first hit (vs the soft-navs that follow).
export const dynamic = 'force-dynamic';

export default function CHybridHome(): React.JSX.Element {
  const renderedAt = new Date().toISOString();
  return (
    <>
      <h1>Acme Cloud</h1>
      <p>
        Server-rendered at <code>{renderedAt}</code> (RSC). Reload to see this change — it only
        changes on a real server render, never on a soft-nav.
      </p>
      <p>
        This is a genuine Next App Router route: <code>/_next/</code> assets,
        <code> self.__next_f</code> flight payload, <code>Vary: RSC</code>. The widget correctly
        detects Next here — the regression is purely about soft-nav, not framework detection.
      </p>
    </>
  );
}
