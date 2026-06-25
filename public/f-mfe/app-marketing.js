/* single-spa-style micro-app. Plain lifecycle (bootstrap/mount/unmount) — no
 * framework. The shell mounts this into its container and unmounts it on
 * route change; the widget must survive that because it lives on
 * document.body, ABOVE every single-spa-application container. */
(function () {
  window.__mfeApps = window.__mfeApps || {};
  window.__mfeApps['@acme/marketing'] = {
    mount: function (el) {
      el.innerHTML =
        '<h1>Acme — Marketing</h1>' +
        '<p>This whole subtree is mounted/unmounted by the single-spa shell. ' +
        'Navigate to Account: this container is destroyed and replaced. The ' +
        '&lt;chat-widget&gt; stays — it is a document.body child, not inside ' +
        'this container.</p>' +
        '<p>nav-probe: single-spa fires pushState AND a synthetic popstate ' +
        '(double-fire). The probe de-dupes by URL → soft-navs counts once.</p>';
    },
    unmount: function (el) {
      el.innerHTML = '';
    },
  };
})();
