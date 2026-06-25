/*
 * embed-bootstrap.js — the SINGLE embed every section uses, verbatim.
 *
 * Re-implements the dev-embed pattern from chat-widget/test.html as a
 * standalone vanilla script (it is NOT imported from the monorepo — the
 * harness is liftable as-is). It resolves runtime config, sets
 * window.__WorknetWidget exactly as a real customer would, and injects the
 * real widget script. Nothing repo-specific is compiled in: every
 * environment value comes from query params / localStorage / the gitignored
 * public/widget-runtime.json.
 *
 * Config precedence: ?wk=&api=&chat=&embed=  >  localStorage  >  json  >  error.
 *
 * Load order contract: nav-probe.js (then expected.js) MUST be included
 * before this file so the probe patches History before any navigation.
 */
(function () {
  'use strict';

  var LS_KEY = 'wn-harness:runtime-config';
  var h = (window.__wnHarness = window.__wnHarness || {});

  function readQuery() {
    var p = new URLSearchParams(window.location.search);
    var out = {};
    if (p.get('wk')) out.widgetKey = p.get('wk');
    if (p.get('api')) out.apiBaseUrl = p.get('api');
    if (p.get('chat')) out.chatAppBaseUrl = p.get('chat');
    if (p.get('embed')) out.embedScriptUrl = p.get('embed');
    if (p.get('embedType')) out.embedScriptType = p.get('embedType');
    return out;
  }

  function readLocalStorage() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function fetchJson() {
    return fetch('/widget-runtime.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : undefined;
      })
      .catch(function () {
        return undefined;
      });
  }

  function strip(v) {
    return typeof v === 'string' ? v.replace(/\/+$/, '') : v;
  }

  // customContext arrives as an object (json) or a JSON string (query/localStorage).
  function parseObject(val) {
    if (!val) return undefined;
    if (typeof val === 'object') return Array.isArray(val) ? undefined : val;
    try {
      var o = JSON.parse(val);
      return o && typeof o === 'object' && !Array.isArray(o) ? o : undefined;
    } catch (e) {
      return undefined;
    }
  }

  function injectConsole() {
    if (h.__consoleInjected) return;
    h.__consoleInjected = true;
    var c = document.createElement('script');
    c.src = '/shared/widget-console.js';
    if (h.cspNonce) c.nonce = h.cspNonce;
    (document.body || document.documentElement).appendChild(c);
  }

  function resolveConfig() {
    var query = readQuery();
    var stored = readLocalStorage();
    return fetchJson().then(function (json) {
      json = json || {};
      // Lower precedence first; spread higher on top.
      var cfg = {};
      [json, stored, query].forEach(function (src) {
        Object.keys(src).forEach(function (k) {
          if (src[k] !== undefined && src[k] !== '') cfg[k] = src[k];
        });
      });
      return cfg;
    });
  }

  function injectWidget(cfg) {
    h.config = cfg;
    injectConsole();

    if (!cfg.widgetKey || /^REPLACE_WITH/.test(cfg.widgetKey)) {
      h.configError =
        'No widgetKey. Set ?wk=wk_… (also ?api=&chat=&embed=) or copy ' +
        'public/widget-runtime.example.json → public/widget-runtime.json ' +
        'and fill in a real wk_ key + local URLs.';
      if (typeof h.onConfig === 'function') h.onConfig();
      return;
    }

    // Persist the working config so a developer only has to pass query params
    // once per browser, then navigate the sections freely.
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    } catch (e) {
      /* private mode — non-fatal */
    }

    window.__WorknetWidget = {
      widgetKey: cfg.widgetKey,
      groupingId: cfg.groupingId || undefined,
      customContext: parseObject(cfg.customContext),
      onReady: function (api) {
        h.onReadyFired = true;
        h.widgetApi = api;
        if (typeof h.onConfig === 'function') h.onConfig();
      },
      onAiHelper: function () {
        h.aiHelperCount = (h.aiHelperCount || 0) + 1;
      },
    };

    // api/chat are optional dev overrides. Without them the widget infers its
    // backend from the embed origin — like a real embed (apiBaseUrl drives load,
    // logs, AND the chat socket; chatAppBaseUrl is SSO-only). Only set when given.
    var overrides = {};
    if (cfg.apiBaseUrl) overrides.apiBaseUrl = strip(cfg.apiBaseUrl);
    if (cfg.chatAppBaseUrl) overrides.chatAppBaseUrl = strip(cfg.chatAppBaseUrl);
    if (overrides.apiBaseUrl || overrides.chatAppBaseUrl) {
      window.__WorknetWidget.unsafeOverrides = overrides;
    }

    // Embed defaults to the local chat-widget dev server (one port below the
    // harness — CHAT_WIDGET/WIDGET_HARNESS share a slot offset), so a bare ?wk=
    // works with nothing else. The widget infers its backend from this origin.
    var embedUrl = cfg.embedScriptUrl;
    var embedType = cfg.embedScriptType;
    if (!embedUrl) {
      var harnessPort = Number(window.location.port);
      if (harnessPort > 0) {
        embedUrl =
          window.location.protocol +
          '//' +
          window.location.hostname +
          ':' +
          (harnessPort - 1) +
          '/src/main.tsx';
        embedType = 'module';
      }
    }
    if (!embedUrl) {
      h.configError = 'No embed script — set ?embed= or run the chat-widget dev server.';
      if (typeof h.onConfig === 'function') h.onConfig();
      return;
    }

    var s = document.createElement('script');
    s.src = embedUrl;
    if (embedType === 'module') {
      s.type = 'module';
    } else {
      s.async = true;
    }
    s.setAttribute('data-wn-embed', '1');
    // CSP (section H): the nonce is stamped on the bootstrap <script> by the
    // server; strict-dynamic propagates trust to this injected script.
    if (h.cspNonce) s.nonce = h.cspNonce;
    s.onerror = function () {
      h.configError = 'Embed script failed to load: ' + embedUrl;
      if (typeof h.onConfig === 'function') h.onConfig();
    };
    document.body.appendChild(s);
    h.embedInjected = true;

    // Remounts <chat-widget> so connectedCallback re-reads the new context and
    // re-fires onReady (re-capturing h.widgetApi) — like a real host reload.
    h.applyContext = function (groupingId, customContext) {
      if (!window.__WorknetWidget) return;
      window.__WorknetWidget.groupingId = groupingId || undefined;
      window.__WorknetWidget.customContext = parseObject(customContext);
      var existing = document.querySelector('chat-widget');
      if (existing) existing.remove();
      h.widgetApi = undefined;
      h.onReadyFired = false;
      var el = document.createElement('chat-widget');
      document.body.appendChild(el);
      if (typeof h.onConfig === 'function') h.onConfig();
    };

    if (typeof h.onConfig === 'function') h.onConfig();
  }

  resolveConfig().then(injectWidget);
})();
