// Injects the SAME three shared scripts every other section uses, in the same
// order. They are served by the parent Next host at /shared/*.js (absolute) —
// the bundle never imports anything from the monorepo or the Next app.

type WnHarness = {
  section?: { id: string; label: string };
  __sharedScriptsInjected?: boolean;
};

export function mountHarnessScripts(section: { id: string; label: string }): void {
  const w = window as unknown as { __wnHarness?: WnHarness };
  w.__wnHarness = w.__wnHarness ?? {};
  w.__wnHarness.section = section;
  if (w.__wnHarness.__sharedScriptsInjected) return;
  w.__wnHarness.__sharedScriptsInjected = true;

  const sources = ['/shared/nav-probe.js', '/shared/expected.js', '/shared/embed-bootstrap.js'];

  function add(i: number): void {
    if (i >= sources.length) return;
    const s = document.createElement('script');
    s.src = sources[i];
    s.onload = () => add(i + 1);
    s.onerror = () => add(i + 1);
    document.body.appendChild(s);
  }
  add(0);
}
