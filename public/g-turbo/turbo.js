/*
 * turbo.js — Turbo/htmx-style "MPA-as-soft-nav" (doc Appendix B Turbo row).
 *
 * The trap: DOM + headers look exactly like the WordPress MPA in /a-mpa
 * (generator meta, /wp-content/, Server: nginx) — but clicks are intercepted,
 * the next page is fetched, the content region is swapped, history.pushState
 * is called, and a turbo:load event fires. NO full document load. So the
 * widget (which has no History instrumentation) keeps stale context and emits
 * no new /load — proving "WordPress-looking ⇏ full reload".
 *
 * Turbo Drive replaces <body> but persists [data-turbo-permanent]; here we
 * swap only #turbo-content so the nav-probe + widget (which live outside it)
 * survive the soft-nav — observably identical (looks like MPA, soft-navs, no
 * new /load), instrumentation intact.
 */
(function () {
  'use strict';

  function samesection(href) {
    try {
      var u = new URL(href, location.href);
      return u.origin === location.origin && u.pathname.indexOf('/g-turbo') === 0;
    } catch (e) {
      return false;
    }
  }

  function visit(href, push) {
    fetch(href, { headers: { 'Turbo-Frame': '_top' } })
      .then(function (r) {
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var next = doc.querySelector('#turbo-content');
        var cur = document.querySelector('#turbo-content');
        if (next && cur) cur.innerHTML = next.innerHTML;
        if (doc.title) document.title = doc.title;
        if (push) history.pushState({ turbo: true }, '', href);
        window.dispatchEvent(new Event('turbo:load'));
      })
      .catch(function () {
        // A real MPA would just hard-navigate on fetch failure.
        location.href = href;
      });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!samesection(href)) return;
    e.preventDefault();
    visit(href, true);
  });

  window.addEventListener('popstate', function () {
    visit(location.pathname, false);
  });
})();
