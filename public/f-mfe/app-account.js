(function () {
  window.__mfeApps = window.__mfeApps || {};
  window.__mfeApps['@acme/account'] = {
    mount: function (el) {
      el.innerHTML =
        '<h1>Acme — Account</h1>' +
        '<p>A different single-spa micro-app. You got here by a soft route ' +
        'change: the shell unmounted @acme/marketing and mounted this one. ' +
        'No document load → the widget emitted no new /load (journey ✗ now), ' +
        'but it is still mounted exactly once (it lives above the MFE root).</p>';
    },
    unmount: function (el) {
      el.innerHTML = '';
    },
  };
})();
