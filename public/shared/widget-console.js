/*
 * widget-console.js — on-page dev console that drives the installed widget.
 *
 * Where nav-probe observes, this acts: it exposes the host API
 * embed-bootstrap.js captured in window.__wnHarness.widgetApi (open / close /
 * submitUserMessage) and surfaces the rejection codes the widget returns.
 * Vanilla and liftable; injected by embed-bootstrap.js on every archetype.
 * Bottom-left; chains window.__wnHarness.onConfig (nav-probe owns the slot)
 * rather than overwriting it.
 */
(function () {
  'use strict';

  var h = (window.__wnHarness = window.__wnHarness || {});

  function getApi() {
    var api = h.widgetApi;
    return api && typeof api === 'object' ? api : undefined;
  }

  // ── panel (own Shadow DOM, fixed bottom-left) ──
  var host = document.createElement('div');
  host.id = 'wn-widget-console';
  host.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;';
  if (h.cspNonce) host.setAttribute('nonce', h.cspNonce);
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  // Chrome is built once so the inputs keep focus/value; only status + result
  // update afterwards.
  root.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '.p{font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#e5e7eb;' +
    'background:#0f172a;border:1px solid #334155;border-radius:8px;width:320px;' +
    'box-shadow:0 8px 28px rgba(0,0,0,.4);overflow:hidden}' +
    '.hd{display:flex;justify-content:space-between;align-items:center;' +
    'padding:7px 10px;background:#1e293b;border-bottom:1px solid #334155;font-weight:700}' +
    '.hd .ttl{color:#fbbf24}' +
    '.bd{padding:8px 10px;display:flex;flex-direction:column;gap:6px}' +
    '.st{font-size:11px}.st b{color:#34d399}.st b.no{color:#f59e0b}' +
    'textarea,input{width:100%;box-sizing:border-box;background:#020617;color:#e5e7eb;' +
    'border:1px solid #334155;border-radius:5px;padding:5px 7px;font:inherit}' +
    'textarea{resize:vertical;min-height:34px}' +
    '.meta{display:flex;gap:6px}.meta>label{flex:1;display:flex;flex-direction:column;gap:2px}' +
    '.meta span{color:#94a3b8;font-size:10px}' +
    '.btns{display:flex;gap:6px}' +
    'button.act{flex:1;cursor:pointer;background:#1e293b;color:#e5e7eb;border:1px solid #334155;' +
    'border-radius:5px;padding:5px 0;font:inherit}' +
    'button.act:hover:not(:disabled){background:#334155}' +
    'button.act.primary{background:#2563eb;border-color:#2563eb}' +
    'button.act:disabled{opacity:.45;cursor:not-allowed}' +
    '.res{font-size:11px;min-height:14px}.res.ok{color:#34d399}.res.bad{color:#f87171}.res.wait{color:#64748b}' +
    '.sec{border-top:1px solid #1e293b;margin-top:2px;padding-top:6px;display:flex;flex-direction:column;gap:6px}' +
    '.sec .lbl{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.04em}' +
    '.min{cursor:pointer;color:#94a3b8;background:none;border:1px solid #334155;' +
    'border-radius:4px;padding:1px 7px}' +
    '.collapsed .bd{display:none}' +
    '</style>' +
    '<div class="p' +
    (h.consoleCollapsed ? ' collapsed' : '') +
    '">' +
    '<div class="hd"><span class="ttl">widget-console</span>' +
    '<button class="min" type="button">' +
    (h.consoleCollapsed ? '▸' : '▾') +
    '</button></div>' +
    '<div class="bd">' +
    '<div class="st">widget: <b class="api no">waiting…</b></div>' +
    '<textarea class="msg" placeholder="message text…" rows="2"></textarea>' +
    '<div class="meta">' +
    '<label><span>meta.displayText</span><input class="dt" type="text" placeholder="optional"></label>' +
    '<label><span>meta.trigger</span><input class="tg" type="text" placeholder="optional"></label>' +
    '</div>' +
    '<div class="btns">' +
    '<button class="act primary send" type="button">Send</button>' +
    '<button class="act open" type="button">Open</button>' +
    '<button class="act close" type="button">Close</button>' +
    '</div>' +
    '<div class="sec">' +
    '<span class="lbl">Context (remounts the widget)</span>' +
    '<input class="gid" type="text" placeholder="groupingId (optional)">' +
    '<textarea class="cc" placeholder="customContext JSON — {&quot;plan&quot;:&quot;pro&quot;}" rows="2"></textarea>' +
    '<button class="act apply" type="button">Apply &amp; remount</button>' +
    '</div>' +
    '<div class="res wait">—</div>' +
    '</div></div>';

  var panel = root.querySelector('.p');
  var apiEl = root.querySelector('.api');
  var msgEl = root.querySelector('.msg');
  var dtEl = root.querySelector('.dt');
  var tgEl = root.querySelector('.tg');
  var sendBtn = root.querySelector('.send');
  var openBtn = root.querySelector('.open');
  var closeBtn = root.querySelector('.close');
  var gidEl = root.querySelector('.gid');
  var ccEl = root.querySelector('.cc');
  var applyBtn = root.querySelector('.apply');
  var resEl = root.querySelector('.res');
  var minBtn = root.querySelector('.min');

  function setResult(text, kind) {
    resEl.textContent = text;
    resEl.className = 'res ' + (kind || 'wait');
  }

  function describeError(e) {
    if (e && typeof e.code === 'string') return e.code;
    if (e && typeof e.message === 'string') return e.message;
    return 'error';
  }

  function updateStatus() {
    var api = getApi();
    if (h.configError) {
      apiEl.textContent = 'config error';
      apiEl.className = 'api no';
    } else if (api) {
      apiEl.textContent = 'api ready';
      apiEl.className = 'api';
    } else {
      apiEl.textContent = h.embedInjected ? 'loading…' : 'no widget installed';
      apiEl.className = 'api no';
    }
    var disabled = !api;
    sendBtn.disabled = disabled;
    openBtn.disabled = disabled;
    closeBtn.disabled = disabled;
    applyBtn.disabled = disabled;
  }

  function buildMeta() {
    var meta = {};
    var dt = dtEl.value.trim();
    var tg = tgEl.value.trim();
    if (dt) meta.displayText = dt;
    if (tg) meta.trigger = tg;
    return Object.keys(meta).length ? meta : undefined;
  }

  sendBtn.addEventListener('click', function () {
    var api = getApi();
    if (!api || typeof api.submitUserMessage !== 'function') {
      return setResult('no widget api yet', 'bad');
    }
    var text = msgEl.value.trim();
    if (!text) return setResult('enter a message first', 'bad');
    var meta = buildMeta();
    var input = meta ? { text: text, meta: meta } : { text: text };
    setResult('sending…', 'wait');
    sendBtn.disabled = true;
    Promise.resolve(api.submitUserMessage(input))
      .then(function () {
        setResult('sent ✓', 'ok');
      })
      .catch(function (e) {
        setResult('rejected: ' + describeError(e), 'bad');
      })
      .then(function () {
        sendBtn.disabled = !getApi();
      });
  });

  openBtn.addEventListener('click', function () {
    var api = getApi();
    if (!api || typeof api.open !== 'function') return setResult('no widget api yet', 'bad');
    try {
      api.open();
      setResult('open() called', 'ok');
    } catch (e) {
      setResult('open failed: ' + describeError(e), 'bad');
    }
  });

  closeBtn.addEventListener('click', function () {
    var api = getApi();
    if (!api || typeof api.close !== 'function') return setResult('no widget api yet', 'bad');
    try {
      api.close();
      setResult('close() called', 'ok');
    } catch (e) {
      setResult('close failed: ' + describeError(e), 'bad');
    }
  });

  applyBtn.addEventListener('click', function () {
    if (typeof h.applyContext !== 'function') return setResult('install a widget first', 'bad');
    var gid = gidEl.value.trim();
    var ccRaw = ccEl.value.trim();
    var cc;
    if (ccRaw) {
      try {
        cc = JSON.parse(ccRaw);
      } catch (e) {
        return setResult('customContext: invalid JSON', 'bad');
      }
      if (!cc || typeof cc !== 'object' || Array.isArray(cc)) {
        return setResult('customContext must be a JSON object', 'bad');
      }
    }
    setResult('applied — remounting…', 'wait');
    h.applyContext(gid, cc);
  });

  minBtn.addEventListener('click', function () {
    h.consoleCollapsed = !h.consoleCollapsed;
    panel.classList.toggle('collapsed', h.consoleCollapsed);
    minBtn.textContent = h.consoleCollapsed ? '▸' : '▾';
  });

  // Chain onConfig (nav-probe owns the slot) instead of clobbering it, so this
  // console re-checks api readiness whenever embed-bootstrap fires it.
  var prevOnConfig = h.onConfig;
  h.onConfig = function () {
    if (typeof prevOnConfig === 'function') prevOnConfig();
    updateStatus();
  };

  function mount() {
    if (!document.body) {
      return void document.addEventListener('DOMContentLoaded', mount);
    }
    document.body.appendChild(host);
    updateStatus();
    // Backstop poll — the api lands async after embed.js.
    setInterval(updateStatus, 1000);
  }
  mount();
})();
