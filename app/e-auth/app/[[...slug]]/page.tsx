'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function ShellPage(): React.JSX.Element {
  const params = useParams<{ slug?: string[] }>();
  const path = (params?.slug ?? []).join('/') || 'dashboard';
  const [autoRenew, setAutoRenew] = useState(true);
  const cards = useMemo(
    () => [
      ['Active users', '42'],
      ['Open invoices', '3'],
      ['Plan usage', '78%'],
    ],
    [],
  );

  if (path === 'billing') {
    return (
      <article>
        <h1>Billing</h1>
        <p>
          Billing data is behind the authenticated shell. Navigating here via <code>&lt;Link&gt;</code>{' '}
          preserves the host app session but does not trigger a new widget <code>/load</code>.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
                Invoice
              </th>
              <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
                Item
              </th>
              <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
                Total
              </th>
              <th scope="col" style={{ borderTop: '1px solid #e2e8f0', padding: 8, textAlign: 'left' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['INV-2048', 'Growth plan', '$588', 'Paid'],
              ['INV-2049', 'Usage overage', '$74', 'Open'],
              ['INV-2050', 'Priority support', '$199', 'Draft'],
            ].map(([id, item, total, status]) => (
              <tr key={id}>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{id}</td>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{item}</td>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{total}</td>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    );
  }

  if (path === 'settings') {
    return (
      <article>
        <h1>Settings</h1>
        <p>Account preferences are app state: they should survive soft-navs but reload from storage.</p>
        <form style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
          <label>
            Company name
            <input
              defaultValue="Acme Industrial"
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(event) => setAutoRenew(event.target.checked)}
            />{' '}
            Auto-renew subscription
          </label>
        </form>
      </article>
    );
  }

  return (
    <article>
      <h1 style={{ textTransform: 'capitalize' }}>{path}</h1>
      <p>
        Shell view <code>/e-auth/app/{path}</code>. Reached by client soft-nav within the
        authenticated app — no full reload, no new widget <code>/load</code>.
      </p>
      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        }}
      >
        {cards.map(([label, value]) => (
          <div
            key={label}
            style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}
          >
            <strong style={{ fontSize: 24 }}>{value}</strong>
            <div style={{ color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </section>
    </article>
  );
}
