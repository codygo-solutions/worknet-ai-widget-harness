'use client';

import { useEffect } from 'react';

import { getWnHarness } from './wnHarness';

// Injects the SAME shared scripts every public/ page includes, in the
// same order (nav-probe → expected → session → embed-bootstrap), so a native-Next
// section embeds the widget identically to a non-Next one. Idempotent: the
// scripts mount once per document even across App-Router soft-navs.
export default function HarnessShell({
  sectionId,
  sectionLabel,
  nonce,
}: {
  sectionId: string;
  sectionLabel: string;
  nonce?: string;
}): null {
  useEffect(() => {
    const harness = getWnHarness();
    harness.section = { id: sectionId, label: sectionLabel };
    if (nonce) harness.cspNonce = nonce;
    if (harness.__sharedScriptsInjected) return;
    harness.__sharedScriptsInjected = true;

    function addScript(src: string, asModule: boolean): Promise<void> {
      return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src;
        if (asModule) s.type = 'module';
        if (nonce) s.nonce = nonce;
        s.onload = () => resolve();
        s.onerror = () => {
          // Surface a load failure (404 / CSP-blocked) instead of silently
          // continuing with the observation layer absent.
          harness.configError = `Failed to load ${src} — the nav-probe may be absent.`;
          harness.onConfig?.();
          resolve();
        };
        document.body.appendChild(s);
      });
    }

    void (async () => {
      await addScript('/shared/nav-probe.js', false);
      await addScript('/shared/expected.js', false);
      await addScript('/shared/session-simulator.js', false);
      await addScript('/shared/embed-bootstrap.js', false);
    })();
  }, [sectionId, sectionLabel, nonce]);

  return null;
}
