/* A pre-existing competing widget already on the hostile host — shaped like
 * Pendo / Beamer / Dialogflow launchers. It must coexist with the real
 * <chat-widget> (different DOM, different launcher, no collision). Injected by
 * the nonced bootstrap so it runs under the strict CSP too. */
(function () {
  'use strict';
  window.pendo = window.pendo || { _q: [], initialize: function () {} };

  function mount() {
    if (document.getElementById('pendo-base')) return;
    var base = document.createElement('div');
    base.id = 'pendo-base';
    var launcher = document.createElement('button');
    launcher.className = 'beamer_defaultBeamerSelector';
    launcher.type = 'button';
    launcher.textContent = '★';
    launcher.setAttribute('aria-label', 'Competing widget');
    launcher.style.cssText =
      'position:fixed;left:16px;bottom:16px;width:48px;height:48px;' +
      'border-radius:50%;border:0;background:#7c3aed;color:#fff;font-size:20px;' +
      'cursor:pointer;z-index:2147483000;box-shadow:0 4px 14px rgba(0,0,0,.3)';
    launcher.addEventListener('click', function () {
      launcher.textContent = launcher.textContent === '★' ? '✕' : '★';
    });
    base.appendChild(launcher);
    document.body.appendChild(base);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
