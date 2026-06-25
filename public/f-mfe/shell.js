/* single-spa-style root config. Route → which micro-app is active. On nav it
 * patches history and synthesizes a popstate (this is exactly what single-spa
 * does — hence the double-fire the nav-probe must de-dupe), and dispatches a
 * `single-spa:routing-event` (the single-spa fingerprint, doc Appendix B). */
(function () {
  'use strict';

  var ROUTES = {
    '/f-mfe': '@acme/marketing',
    '/f-mfe/': '@acme/marketing',
    '/f-mfe/account': '@acme/account',
  };
  var mounted = null;

  function containerFor(name) {
    return document.getElementById('single-spa-application:' + name);
  }

  function reconcile() {
    var path = location.pathname;
    var want = ROUTES[path] || '@acme/marketing';
    if (mounted === want) return;
    if (mounted && window.__mfeApps[mounted]) {
      window.__mfeApps[mounted].unmount(containerFor(mounted));
      containerFor(mounted).style.display = 'none';
    }
    var el = containerFor(want);
    if (el && window.__mfeApps[want]) {
      el.style.display = '';
      window.__mfeApps[want].mount(el);
    }
    mounted = want;
  }

  function navigate(href) {
    history.pushState({}, '', href);
    // single-spa synthesizes a popstate after pushState — the double-fire.
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new CustomEvent('single-spa:routing-event'));
    reconcile();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-spa-link]');
    if (!a) return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  });
  window.addEventListener('popstate', reconcile);
  window.addEventListener('single-spa:routing-event', function () {});

  reconcile();
})();
