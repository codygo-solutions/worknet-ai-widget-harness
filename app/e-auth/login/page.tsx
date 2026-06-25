'use client';

import { useState } from 'react';

import HarnessShell from '../../_components/HarnessShell';

// The login is a SEPARATE document (full navigation, like a real IdP
// redirect). The widget loads here too — BEFORE any user object exists.
// Submitting writes a mock token and hard-navigates to the shell, so the
// widget re-/loads there and "re-identifies".
export default function LoginPage(): React.JSX.Element {
  const [email, setEmail] = useState('user@acme.test');

  function onSubmit(e: React.FormEvent): void {
    e.preventDefault();
    try {
      window.localStorage.setItem(
        'wn-harness:e-auth-token',
        JSON.stringify({ sub: email, iat: Date.now() }),
      );
    } catch {
      /* private mode — the shell guard will just bounce back here */
    }
    // Full navigation (not <Link>) — simulates the post-IdP redirect.
    window.location.assign('/e-auth/app');
  }

  return (
    <main className="wrap" style={{ maxWidth: 380 }}>
      <HarnessShell sectionId="E" sectionLabel="E · Auth-gated (login)" />
      <h1 className="title">Sign in</h1>
      <p className="sub">
        Widget loads here, pre-user (anonymous). After login the shell is a different document — the
        widget re-loads and re-identifies.
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          aria-label="Email"
          style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <input
          type="password"
          defaultValue="hunter2"
          aria-label="Password"
          style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <button
          type="submit"
          style={{
            padding: '9px 14px',
            background: '#2563eb',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Sign in →
        </button>
      </form>
    </main>
  );
}
