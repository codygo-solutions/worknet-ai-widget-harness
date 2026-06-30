import { headers } from 'next/headers';

// H is a thin server route ONLY so the bootstrap can be stamped with the
// per-request nonce the middleware generated (and put in the strict CSP). The
// nonced inline script is the single trusted root; strict-dynamic propagates
// trust to the shared scripts it injects and, transitively, to the widget
// embed they inject. The competing widget + bleed CSS stay in public/.
export default async function HHostileLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const nonce = (await headers()).get('x-nonce') ?? '';
  const n = JSON.stringify(nonce);

  const boot = `
window.__wnHarness = window.__wnHarness || {};
window.__wnHarness.section = { id: 'H', label: 'H · Hostile host (strict CSP)' };
window.__wnHarness.cspNonce = ${n};
(function () {
  var nonce = ${n};
  function add(src, then) {
    var s = document.createElement('script');
    s.src = src;
    if (nonce) s.setAttribute('nonce', nonce);
    if (then) { s.onload = then; s.onerror = then; }
    else { s.onerror = function () {
      window.__wnHarness.configError = 'CSP blocked ' + src + ' — check the H CSP allowlist.';
      if (typeof window.__wnHarness.onConfig === 'function') window.__wnHarness.onConfig();
    }; }
    document.body.appendChild(s);
  }
  // Order matters: nav-probe patches History/fetch before the widget loads.
  add('/shared/nav-probe.js', function () {
    add('/shared/expected.js', function () {
      add('/shared/session-simulator.js', function () {
        add('/shared/embed-bootstrap.js');
      });
    });
  });
  // A pre-existing competing widget already on the host (must coexist).
  add('/h-hostile/competing-widget.js');
})();
`.trim();

  return (
    <>
      {/* Aggressive host CSS that would wreck a non-Shadow-DOM widget. The
          real widget is Shadow-DOM isolated, so it is immune. */}
      <link rel="stylesheet" href="/h-hostile/host-bleed.css" />
      {children}
      {/* Browsers blank the `nonce` attribute in the live DOM after applying
          CSP (anti-exfiltration), so the hydrated value never matches the
          server value. That divergence is expected, not a bug — tell React. */}
      <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: boot }} />
    </>
  );
}
