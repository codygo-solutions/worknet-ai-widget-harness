import { Link, Outlet, useParams, type RouteObject } from 'react-router-dom';

// One React-Router app, shared by B1 (createBrowserRouter, real history) and
// B2 (createHashRouter, #/ routes). The ONLY difference between B1 and B2 is
// which router wraps these routes — the soft-nav regression is identical.

const shell: React.CSSProperties = {
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  color: '#0f172a',
  maxWidth: 720,
  margin: '40px auto',
  padding: '0 20px',
};
const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: 12,
  marginBottom: 20,
};

function Layout(): React.JSX.Element {
  return (
    <div style={shell}>
      <nav style={navStyle}>
        <strong>Acme SPA</strong>
        <Link to="/">Home</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/solutions/logistics">Solutions</Link>
        <a href="/" style={{ marginLeft: 'auto' }}>
          ← directory (hard nav)
        </a>
      </nav>
      <Outlet />
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 32 }}>
        Each in-app link calls <code>history.pushState</code> with no nav event. The widget has no
        History instrumentation → it never re-reads context and emits no new <code>/load</code>.
        nav-probe (bottom-right) shows soft-navs rising while hard-reloads stays 1, and the journey
        row as
        <strong> ✗(now)</strong>.
      </p>
    </div>
  );
}

function Home(): React.JSX.Element {
  return (
    <>
      <h1>React-Router SPA</h1>
      <p>
        Real <code>&lt;div id="root"&gt;</code> + a hashed Vite module bundle —
        zero Next.js asset fingerprints. This is the literal condition the
        widget fails on: client routing with no browser navigation event.
      </p>
    </>
  );
}

function Pricing(): React.JSX.Element {
  return (
    <>
      <h1>Pricing</h1>
      <p>Soft-navigated here. Check the nav-probe log for the pushState entry.</p>
    </>
  );
}

function Solution(): React.JSX.Element {
  const { slug } = useParams();
  return (
    <>
      <h1>Solution: {slug}</h1>
      <p>
        A parameterised route — still a pushState soft-nav, still no new
        <code>/load</code>.
      </p>
    </>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'solutions/:slug', element: <Solution /> },
    ],
  },
];
