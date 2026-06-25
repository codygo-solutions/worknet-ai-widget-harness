import Link from 'next/link';

export default function HHostileSecondary(): React.JSX.Element {
  return (
    <main className="wrap">
      <p className="crumb">strict CSP · soft-navigated within /h-hostile</p>
      <h1>Hostile host — page 2</h1>
      <p>
        You arrived via an App-Router soft-nav under the strict CSP. The widget is still mounted and
        CSP-clean, but it emitted no new <code>/load</code>— so from here the journey/AI-helper rows
        read ✗(now), exactly like every other soft-nav archetype. H is &ldquo;✓ first page
        only&rdquo;.
      </p>
      <Link href="/h-hostile">← back (soft-nav)</Link>
    </main>
  );
}
