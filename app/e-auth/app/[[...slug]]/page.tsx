'use client';

import { useParams } from 'next/navigation';

export default function ShellPage(): React.JSX.Element {
  const params = useParams<{ slug?: string[] }>();
  const path = (params?.slug ?? []).join('/') || 'dashboard';
  return (
    <article>
      <h1 style={{ textTransform: 'capitalize' }}>{path}</h1>
      <p>
        Shell view <code>/e-auth/app/{path}</code>. Reached by client soft-nav within the
        authenticated app — no full reload, no new widget <code>/load</code>.
      </p>
    </article>
  );
}
