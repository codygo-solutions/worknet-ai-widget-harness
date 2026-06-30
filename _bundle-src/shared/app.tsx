import { Link, Outlet, useParams, type RouteObject } from 'react-router-dom';
import { useMemo, useState } from 'react';

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
const grid: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
};
const card: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: 14,
  background: '#fff',
};
const input: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  padding: '8px 10px',
};

function Layout(): React.JSX.Element {
  return (
    <div style={shell}>
      <nav style={navStyle}>
        <strong>Acme SPA</strong>
        <Link to="/">Home</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/solutions/logistics">Solutions</Link>
        <Link to="/settings">Settings</Link>
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
      <h1>Operations dashboard</h1>
      <p>
        Real <code>&lt;div id="root"&gt;</code> + a hashed Vite module bundle —
        zero Next.js asset fingerprints. This is the literal condition the
        widget fails on: client routing with no browser navigation event.
      </p>
      <section style={grid} aria-label="Operational metrics">
        {[
          ['Open orders', '128'],
          ['Late shipments', '7'],
          ['Support tickets', '23'],
        ].map(([label, value]) => (
          <div key={label} style={card}>
            <strong style={{ fontSize: 24 }}>{value}</strong>
            <div style={{ color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </section>
    </>
  );
}

function Orders(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const rows = useMemo(
    () =>
      [
        ['SO-1044', 'Apex Foods', 'Packing', '$4,820'],
        ['SO-1045', 'Northwind Labs', 'Awaiting PO', '$12,400'],
        ['SO-1046', 'Riverline Supply', 'In transit', '$2,190'],
      ].filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  return (
    <>
      <h1>Orders</h1>
      <p>Filterable client-side table state survives soft-navs in memory and resets on hard reload.</p>
      <input
        aria-label="Search orders"
        placeholder="Search customer or order"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        style={{ ...input, width: '100%', marginBottom: 12 }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
              Order
            </th>
            <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
              Customer
            </th>
            <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
              Status
            </th>
            <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([id, customer, status, total]) => (
            <tr key={id}>
              <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{id}</td>
              <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{customer}</td>
              <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{status}</td>
              <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Pricing(): React.JSX.Element {
  const [seats, setSeats] = useState(12);
  return (
    <>
      <h1>Pricing</h1>
      <p>Soft-navigated checkout calculator. Check the nav-probe log for the pushState entry.</p>
      <label>
        Seats: <strong>{seats}</strong>
        <input
          aria-label="Seats"
          type="range"
          min={1}
          max={50}
          value={seats}
          onChange={(event) => setSeats(Number(event.target.value))}
          style={{ width: '100%' }}
        />
      </label>
      <div style={card}>Estimated monthly total: <strong>${seats * 49}</strong></div>
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
      <div style={card}>
        <h2>Implementation checklist</h2>
        <label><input type="checkbox" defaultChecked /> Import shipment feed</label><br />
        <label><input type="checkbox" /> Map carrier exceptions</label><br />
        <label><input type="checkbox" /> Invite warehouse team</label>
      </div>
    </>
  );
}

function Settings(): React.JSX.Element {
  const [region, setRegion] = useState('us-east');
  return (
    <>
      <h1>Account settings</h1>
      <p>Real SPAs often keep forms mounted across client transitions but rebuild them on reload.</p>
      <form style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
        <label>
          Workspace name
          <input defaultValue="Acme Operations" style={{ ...input, width: '100%' }} />
        </label>
        <label>
          Data region
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            style={{ ...input, width: '100%' }}
          >
            <option value="us-east">US East</option>
            <option value="eu-west">EU West</option>
            <option value="ap-south">AP South</option>
          </select>
        </label>
      </form>
    </>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'orders', element: <Orders /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'solutions/:slug', element: <Solution /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
];
