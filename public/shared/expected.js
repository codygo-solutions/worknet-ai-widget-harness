/*
 * expected.js — doc §7 "Feature → scenario matrix", machine form.
 *
 * `✓`      expected to work today
 * `✗(now)` expected-FAIL with the current widget (no History instrumentation;
 *          flips to ✓ once the separate widget History fix lands — this file
 *          is what makes the regression a permanent, visible surface)
 * `✓¹`     works first page only (true for H — its one soft link then shows
 *          the same ✗(now) regression as everything else)
 *
 * Single mount is ✓ everywhere in v1: the harness deliberately keeps the
 * widget root above the MFE container (F) and does not build the Astro-VT
 * <body>-swap variant (C is native Next, not Astro-VT) — those are the only
 * §7 ✗ single-mount cases and they are Tier-2 / anti-pattern, out of scope.
 */
(function () {
  var h = (window.__wnHarness = window.__wnHarness || {});
  h.expected = {
    A: { journey: '✓', aiHelper: '✓', singleMount: '✓' },
    B1: { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    B2: { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    'C-app': { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    'C-pages': { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    D: { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    E: { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    F: { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    G: { journey: '✗(now)', aiHelper: '✗(now)', singleMount: '✓' },
    H: { journey: '✓¹', aiHelper: '✓¹', singleMount: '✓' },
    I: { journey: '✓', aiHelper: '✓', singleMount: '✓' },
  };
})();
