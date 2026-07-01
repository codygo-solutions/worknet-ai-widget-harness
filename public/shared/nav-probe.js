/*
 * nav-probe.js — on-page instrumentation panel (doc §6.3).
 *
 * Observe-only. It patches History exactly the way a *correct* widget would
 * (Appendix C5) — but ONLY to measure. It never feeds anything back into the
 * widget, so what it shows is the widget's real behaviour: on every soft-nav
 * archetype the widget emits no new /load and keeps stale page context, so
 * the §7 "✗(now)" cells render red. When the widget's History fix lands
 * (separate issue) the widget itself starts emitting /load on soft-nav and
 * these cells flip green with this file unchanged.
 *
 * Must be included before embed-bootstrap.js so History is patched before
 * any navigation happens.
 */
(function () {
  'use strict';

  var h = (window.__wnHarness = window.__wnHarness || {});
  var section = h.section || { id: '?', label: 'unknown section' };

  // ── hard-reload counter (survives reload, scoped per section) ──
  var HARD_KEY = 'wn-harness:hard:' + section.id;
  var hardReloads = 0;
  try {
    hardReloads = parseInt(window.sessionStorage.getItem(HARD_KEY) || '0', 10) + 1;
    window.sessionStorage.setItem(HARD_KEY, String(hardReloads));
  } catch (e) {
    hardReloads = 1;
  }

  var softNavs = 0;
  var navLog = [];
  var lastHref = window.location.href;
  var loadCalls = []; // { href, t } each time the widget POSTs /widget/load
  var lastLoadCountAtNav = 0;

  function ts() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
  }

  function pushLog(kind, path) {
    navLog.push({ t: ts(), kind: kind, path: path });
    if (navLog.length > 8) navLog.shift();
    render();
  }

  // ── History patch (Appendix C5) — observe-only ──
  function onLocationChange(kind) {
    // Same-URL is never a navigation: de-dups single-spa's pushState+synthetic
    // popstate AND a startup replaceState(…, '', location.href) history-seed
    // (App Router / many routers do this) — counting that as a soft-nav would
    // render a spurious ✗ before any real navigation.
    if (window.location.href === lastHref) return;
    lastHref = window.location.href;
    softNavs += 1;
    lastLoadCountAtNav = loadCalls.length;
    pushLog(kind, window.location.pathname + window.location.hash);
  }

  ['pushState', 'replaceState'].forEach(function (m) {
    var orig = history[m];
    history[m] = function () {
      var r = orig.apply(this, arguments);
      onLocationChange(m);
      return r;
    };
  });
  window.addEventListener('popstate', function () {
    onLocationChange('popstate');
  });
  window.addEventListener('hashchange', function () {
    onLocationChange('hashchange');
  });

  // ── network observation: detect the widget's POST /v2/chat-apps/widget/load ──
  function isLoadUrl(url) {
    return typeof url === 'string' && /\/v2\/chat-apps\/widget\/load\b/.test(url);
  }
  function recordLoad() {
    loadCalls.push({ href: window.location.href, t: ts() });
    render();
  }

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      var isReq = typeof Request !== 'undefined' && input instanceof Request;
      var url = typeof input === 'string' ? input : isReq ? input.url : input && input.url;
      // init.method wins (fetch spec); else the Request's own method; else GET.
      var method = (init && init.method) || (isReq ? input.method : undefined) || 'GET';
      if (isLoadUrl(url) && String(method).toUpperCase() === 'POST') recordLoad();
      return origFetch.apply(this, arguments);
    };
  }
  var XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    var origOpen = XHR.prototype.open;
    var origSend = XHR.prototype.send;
    XHR.prototype.open = function (method, url) {
      this.__wnMethod = method;
      this.__wnUrl = url;
      return origOpen.apply(this, arguments);
    };
    XHR.prototype.send = function () {
      if (isLoadUrl(this.__wnUrl) && String(this.__wnMethod).toUpperCase() === 'POST') {
        recordLoad();
      }
      return origSend.apply(this, arguments);
    };
  }

  // ── derived actuals ──
  function widgetCount() {
    return document.querySelectorAll('chat-widget').length;
  }
  function lastLoadHref() {
    return loadCalls.length ? loadCalls[loadCalls.length - 1].href : undefined;
  }
  function loadFiredSinceLastNav() {
    return softNavs > 0 && loadCalls.length > lastLoadCountAtNav;
  }
  function journeyActual() {
    if (softNavs === 0) {
      return loadCalls.length ? { sym: '✓', note: '/load on entry' } : { sym: '·', note: 'waiting' };
    }
    return loadFiredSinceLastNav()
      ? { sym: '✓', note: 'new /load' }
      : { sym: '✗', note: 'no /load' };
  }
  function singleMountActual() {
    var n = widgetCount();
    return n === 1 ? { sym: '✓', note: '1' } : { sym: '✗', note: String(n) };
  }
  function sessionSummary() {
    var s = h.session;
    if (!s) {
      return {
        visitor: 'loading',
        session: 'loading',
        grouping: '—',
        user: 'anonymous',
        events: '',
      };
    }
    var visitor = s.visitor || {};
    var app = s.appSession || {};
    var user = app.user && app.user.email ? app.user.email : 'anonymous';
    var events = (h.sessionEvents || [])
      .slice()
      .reverse()
      .map(function (e) {
        return (
          '<div class="logline"><span>' +
          esc(e.t) +
          '</span> ' +
          esc(e.kind) +
          ' <em>' +
          esc(e.detail || '') +
          '</em></div>'
        );
      })
      .join('');
    return {
      visitor: (visitor.kind || '?') + ' · visits ' + (visitor.visits || 0),
      session: app.status || '?',
      grouping: s.groupingId || '—',
      user: user,
      events: events,
    };
  }

  // ── panel (own Shadow DOM, top-left; draggable by header) ──
  // Top-left keeps it clear of the widget (bottom-right) and console (bottom-left).
  var host = document.createElement('div');
  host.id = 'wn-nav-probe';
  // No `all:initial` here — it would reset the positioning set alongside it.
  // Host stays isolated via the Shadow root + `:host{all:initial}` inside it
  // (inline styles win over the :host rule, so positioning sticks).
  host.style.cssText = 'position:fixed;left:12px;top:12px;z-index:2147483647;';
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  // ── drag (header is the handle) ──
  var POS_KEY = 'wn-harness:navprobe-pos';
  var dragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragLeft = 0;
  var dragTop = 0;

  function placeAt(left, top) {
    var maxLeft = Math.max(0, window.innerWidth - host.offsetWidth);
    var maxTop = Math.max(0, window.innerHeight - host.offsetHeight);
    host.style.left = Math.max(0, Math.min(left, maxLeft)) + 'px';
    host.style.top = Math.max(0, Math.min(top, maxTop)) + 'px';
    host.style.right = 'auto';
    host.style.bottom = 'auto';
  }

  function onDragMove(e) {
    if (!dragging) return;
    placeAt(dragLeft + (e.clientX - dragStartX), dragTop + (e.clientY - dragStartY));
  }

  function onDragUp() {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    document.body.style.userSelect = '';
    try {
      window.localStorage.setItem(
        POS_KEY,
        JSON.stringify({ left: host.style.left, top: host.style.top }),
      );
    } catch (e) {
      /* private mode — non-fatal */
    }
  }

  function startDrag(e) {
    // The collapse button lives in the header; don't start a drag from it.
    if (e.target && e.target.closest && e.target.closest('.min')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    var rect = host.getBoundingClientRect();
    dragLeft = rect.left;
    dragTop = rect.top;
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
    e.preventDefault();
  }

  function restorePos() {
    try {
      var raw = window.localStorage.getItem(POS_KEY);
      if (!raw) return;
      var p = JSON.parse(raw);
      if (p && p.left && p.top) placeAt(parseInt(p.left, 10), parseInt(p.top, 10));
    } catch (e) {
      /* ignore */
    }
  }

  // The panel is built via innerHTML; any value derived from the URL
  // (pathname/hash) or the config-error string must be HTML-escaped so a
  // crafted link to the harness cannot inject markup into the probe panel.
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function row(label, expectedSym, actual) {
    var cls = actual.sym === '✗' ? 'bad' : actual.sym === '✓' ? 'ok' : 'wait';
    return (
      '<tr><td>' +
      label +
      '</td><td class="exp">' +
      expectedSym +
      '</td><td class="' +
      cls +
      '">' +
      actual.sym +
      ' ' +
      actual.note +
      '</td></tr>'
    );
  }

  function render() {
    var exp = (h.expected && h.expected[section.id]) || {
      journey: '?',
      aiHelper: '?',
      singleMount: '?',
    };
    var loadedHref = lastLoadHref();
    var loadedPath = loadedHref ? new URL(loadedHref).pathname : '—';
    var curPath = window.location.pathname + window.location.hash;
    var stale = softNavs > 0 && !loadFiredSinceLastNav();
    var jr = journeyActual();
    var sm = singleMountActual();
    var aiActual = jr; // AI-helper re-scan rides the same /load today
    var ss = sessionSummary();
    var logHtml = navLog
      .slice()
      .reverse()
      .map(function (e) {
        return (
          '<div class="logline"><span>' +
          e.t +
          '</span> ' +
          esc(e.kind) +
          ' <em>' +
          esc(e.path) +
          '</em></div>'
        );
      })
      .join('');

    var banner = h.configError
      ? '<div class="banner">⚠ ' + esc(h.configError) + '</div>'
      : '';

    root.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '.p{font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#e5e7eb;' +
      'background:#0f172a;border:1px solid #334155;border-radius:8px;width:340px;' +
      'box-shadow:0 8px 28px rgba(0,0,0,.4);overflow:hidden}' +
      '.hd{display:flex;justify-content:space-between;align-items:center;' +
      'padding:7px 10px;background:#1e293b;border-bottom:1px solid #334155;font-weight:700;' +
      'cursor:move;touch-action:none;user-select:none}' +
      '.hd .sec{color:#93c5fd}' +
      '.bd{padding:8px 10px}' +
      '.counts{display:flex;gap:14px;margin-bottom:6px}' +
      '.counts b{color:#fbbf24}' +
      '.log{background:#020617;border-radius:5px;padding:6px 8px;max-height:96px;' +
      'overflow:auto;margin:6px 0}' +
      '.session{background:#111827;border:1px solid #1f2937;border-radius:6px;padding:6px 8px;margin:7px 0}' +
      '.session strong{color:#bfdbfe}.session .actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}' +
      '.session button{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#dbeafe;background:#1e3a8a;border:1px solid #3b82f6;border-radius:4px;padding:2px 6px;cursor:pointer}' +
      '.session button:hover{background:#1d4ed8}' +
      '.logline{white-space:nowrap}.logline span{color:#64748b}.logline em{color:#a5b4fc;font-style:normal}' +
      '.log:empty::after{content:"no nav yet";color:#475569}' +
      '.wurl{margin:4px 0}.warn{color:#f59e0b}' +
      'table{border-collapse:collapse;width:100%;margin-top:6px}' +
      'td{padding:3px 4px;border-top:1px solid #1e293b}' +
      'th{text-align:left;color:#94a3b8;font-weight:600;padding:2px 4px}' +
      '.exp{color:#93c5fd}.ok{color:#34d399}.bad{color:#f87171}.wait{color:#64748b}' +
      '.banner{background:#7f1d1d;color:#fecaca;padding:6px 8px;font-size:11px}' +
      '.min{cursor:pointer;color:#94a3b8;background:none;border:1px solid #334155;' +
      'border-radius:4px;padding:1px 7px}' +
      '.collapsed .bd{display:none}' +
      '</style>' +
      '<div class="p' +
      (h.probeCollapsed ? ' collapsed' : '') +
      '">' +
      '<div class="hd"><span>nav-probe · <span class="sec">' +
      section.label +
      '</span></span>' +
      '<button class="min">' +
      (h.probeCollapsed ? '▸' : '▾') +
      '</button></div>' +
      banner +
      '<div class="bd">' +
      '<div class="counts"><span>hard reloads: <b>' +
      hardReloads +
      '</b></span><span>soft-navs: <b>' +
      softNavs +
      '</b></span></div>' +
      '<div class="session">' +
      '<div>visitor: <strong>' +
      esc(ss.visitor) +
      '</strong> · app session: <strong>' +
      esc(ss.session) +
      '</strong></div>' +
      '<div>user: <strong>' +
      esc(ss.user) +
      '</strong></div>' +
      '<div>grouping: <strong>' +
      esc(ss.grouping) +
      '</strong></div>' +
      '<div class="actions">' +
      '<button data-action="expire">expire</button>' +
      '<button data-action="logout">logout</button>' +
      '<button data-action="clear-storage">Clear storage</button>' +
      '</div>' +
      '<div class="log">' +
      ss.events +
      '</div>' +
      '</div>' +
      '<div class="log">' +
      logHtml +
      '</div>' +
      '<div>&lt;chat-widget&gt; in DOM: <b>' +
      widgetCount() +
      '</b> · onReady: <b>' +
      (h.onReadyFired ? 'yes' : 'no') +
      '</b></div>' +
      '<div class="wurl">widget loaded url: <b>' +
      esc(loadedPath) +
      '</b>' +
      (stale ? ' <span class="warn">(page: ' + esc(curPath) + ') ⚠ stale</span>' : '') +
      '</div>' +
      '<table><tr><th>Expected vs Actual</th><th class="exp">exp</th><th>actual</th></tr>' +
      row('Page-change journey signal', exp.journey, jr) +
      row('AI-helper re-scan', exp.aiHelper, aiActual) +
      row('Single mount', exp.singleMount, sm) +
      '</table>' +
      '</div></div>';

    var btn = root.querySelector('.min');
    if (btn) {
      btn.addEventListener('click', function () {
        h.probeCollapsed = !h.probeCollapsed;
        render();
      });
    }
    // Header is rebuilt each render, so rebind the drag handle (as with .min).
    var hd = root.querySelector('.hd');
    if (hd) hd.addEventListener('pointerdown', startDrag);
    root.querySelectorAll('[data-action]').forEach(function (el) {
      el.addEventListener('click', function () {
        var actions = h.session && h.session.actions;
        if (!actions) return;
        var action = el.getAttribute('data-action');
        if (action === 'expire') actions.expireSession();
        if (action === 'logout') actions.logout();
        if (action === 'clear-storage') actions.clearStorage();
      });
    });
  }

  h.onConfig = render;
  h.onSessionChange = render;

  function mount() {
    if (!document.body) {
      return void document.addEventListener('DOMContentLoaded', mount);
    }
    document.body.appendChild(host);
    restorePos();
    render();
    // Light poll: catches the widget's /load + DOM mount which happen async
    // after embed.js, and keeps the panel honest without user interaction.
    setInterval(render, 1000);
  }
  mount();
})();
