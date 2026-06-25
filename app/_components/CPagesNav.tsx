import Link from 'next/link';

// Single nav shape for every C-pages (Pages Router) route, so link set and
// styling stay consistent across index / pricing / solutions.
export default function CPagesNav(): React.JSX.Element {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 16,
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: 12,
        marginBottom: 20,
      }}
    >
      <strong>Acme (Pages Router)</strong>
      <Link href="/c-pages">Home</Link>
      <Link href="/c-pages/pricing">Pricing</Link>
      <Link href="/c-pages/solutions/logistics">Solutions</Link>
      <a href="/" style={{ marginLeft: 'auto' }}>
        ← directory (hard nav)
      </a>
    </nav>
  );
}
