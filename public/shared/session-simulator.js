/*
 * session-simulator.js — host-app visitor/session state for realistic tests.
 *
 * This models what a tenant app knows about a visitor. It deliberately does
 * not inspect or mutate the real widget's own localStorage/sessionStorage keys.
 */
(function () {
  'use strict';

  var VISITOR_KEY = 'wn-harness:visitor';
  var APP_SESSION_KEY = 'wn-harness:app-session';
  var ONBOARDING_KEY = 'wn-harness:onboarding';
  var RUNTIME_CONFIG_KEY = 'wn-harness:runtime-config';
  var h = (window.__wnHarness = window.__wnHarness || {});
  var params = new URLSearchParams(window.location.search);

  function now() {
    return new Date().toISOString();
  }

  function id(prefix) {
    var bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return (
      prefix +
      '_' +
      Array.from(bytes)
        .map(function (b) {
          return b.toString(16).padStart(2, '0');
        })
        .join('')
    );
  }

  function readJson(store, key) {
    try {
      var raw = store.getItem(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch (e) {
      return undefined;
    }
  }

  function writeJson(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private mode — non-fatal */
    }
  }

  function remove(store, key) {
    try {
      store.removeItem(key);
    } catch (e) {
      /* private mode — non-fatal */
    }
  }

  function emit(kind, detail) {
    h.sessionEvents = h.sessionEvents || [];
    h.sessionEvents.push({
      t: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      kind: kind,
      detail: detail || '',
    });
    if (h.sessionEvents.length > 8) h.sessionEvents.shift();
    if (typeof h.onSessionChange === 'function') h.onSessionChange();
    if (typeof h.onConfig === 'function') h.onConfig();
  }

  function clearHostStorage(reason) {
    remove(window.localStorage, VISITOR_KEY);
    remove(window.localStorage, ONBOARDING_KEY);
    remove(window.sessionStorage, APP_SESSION_KEY);
    emit('storage:clear', reason || 'host keys');
  }

  function clearAllBrowserStorage() {
    try {
      window.localStorage.clear();
    } catch (e) {
      /* private mode — non-fatal */
    }
    try {
      window.sessionStorage.clear();
    } catch (e) {
      /* private mode — non-fatal */
    }
  }

  function currentRuntimeConfig() {
    if (h.config && typeof h.config === 'object') return h.config;
    return readJson(window.localStorage, RUNTIME_CONFIG_KEY) || {};
  }

  function setIfPresent(search, key, value) {
    if (typeof value === 'string' && value !== '') search.set(key, value);
  }

  function urlWithRuntimeConfig(cfg) {
    var url = new URL(window.location.href);
    setIfPresent(url.searchParams, 'wk', cfg.widgetKey);
    setIfPresent(url.searchParams, 'embed', cfg.embedScriptUrl);
    setIfPresent(url.searchParams, 'embedType', cfg.embedScriptType);
    setIfPresent(url.searchParams, 'api', cfg.apiBaseUrl);
    setIfPresent(url.searchParams, 'chat', cfg.chatAppBaseUrl);
    return url.pathname + url.search + url.hash;
  }

  function reloadAsNewcomer(reason) {
    var nextUrl = urlWithRuntimeConfig(currentRuntimeConfig());
    emit(reason || 'reload', 'clear storage');
    clearAllBrowserStorage();
    window.location.assign(nextUrl);
  }

  if (params.get('storage') === 'clear') clearHostStorage('query');

  var visitorIntent = params.get('visitor');
  var sessionIntent = params.get('session');
  var existingVisitor = readJson(window.localStorage, VISITOR_KEY);
  var createdVisitor = !existingVisitor || visitorIntent === 'new';

  var visitor = createdVisitor
    ? {
        id: id('vis'),
        firstSeenAt: now(),
        lastSeenAt: now(),
        visits: 0,
      }
    : existingVisitor;

  visitor.visits = Number(visitor.visits || 0) + 1;
  visitor.lastSeenAt = now();
  visitor.kind = createdVisitor || visitorIntent === 'new' ? 'new' : 'returning';
  if (visitorIntent === 'returning' && visitor.visits < 2) visitor.visits = 2;
  writeJson(window.localStorage, VISITOR_KEY, visitor);

  var onboarding = readJson(window.localStorage, ONBOARDING_KEY) || {
    seenWelcome: false,
    checklistDone: [],
  };
  if (visitor.kind === 'returning') onboarding.seenWelcome = true;
  writeJson(window.localStorage, ONBOARDING_KEY, onboarding);

  var appSession =
    readJson(window.sessionStorage, APP_SESSION_KEY) ||
    ({
      id: id('sess'),
      status: 'anonymous',
      startedAt: now(),
      lastActivityAt: now(),
      user: null,
    });

  function setSession(next, eventKind) {
    appSession = Object.assign({}, appSession, next, { lastActivityAt: now() });
    writeJson(window.sessionStorage, APP_SESSION_KEY, appSession);
    publish();
    emit(eventKind || 'session:update', appSession.status);
  }

  if (sessionIntent === 'expired') {
    appSession.status = 'expired';
    appSession.user = null;
    appSession.expiredAt = now();
  } else if (sessionIntent === 'authenticated') {
    appSession.status = 'authenticated';
    appSession.user = {
      id: 'usr_demo',
      email: params.get('email') || 'user@acme.test',
      plan: 'growth',
      role: 'admin',
    };
  } else if (sessionIntent === 'anonymous') {
    appSession.status = 'anonymous';
    appSession.user = null;
  }
  appSession.lastActivityAt = now();
  writeJson(window.sessionStorage, APP_SESSION_KEY, appSession);

  function context() {
    return {
      source: 'worknet-widget-harness',
      sectionId: h.section && h.section.id,
      path: window.location.pathname + window.location.hash,
      visitor: {
        id: visitor.id,
        kind: visitor.kind,
        visits: visitor.visits,
        firstSeenAt: visitor.firstSeenAt,
      },
      appSession: {
        id: appSession.id,
        status: appSession.status,
        user: appSession.user,
      },
      onboarding: onboarding,
    };
  }

  function publish() {
    h.session = {
      visitor: visitor,
      appSession: appSession,
      onboarding: onboarding,
      groupingId: 'host-' + visitor.id,
      customContext: context(),
      storage: {
        visitorKey: VISITOR_KEY,
        sessionKey: APP_SESSION_KEY,
        onboardingKey: ONBOARDING_KEY,
      },
      actions: {
        resetVisitor: function () {
          reloadAsNewcomer('visitor:reset');
        },
        expireSession: function () {
          setSession({ status: 'expired', user: null, expiredAt: now() }, 'session:expired');
        },
        loginAs: function (email) {
          setSession(
            {
              status: 'authenticated',
              user: {
                id: 'usr_' + String(email || 'user').replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
                email: email || 'user@acme.test',
                plan: 'growth',
                role: 'admin',
              },
            },
            'login',
          );
        },
        logout: function () {
          setSession({ status: 'anonymous', user: null }, 'logout');
        },
        simulateReload: function () {
          reloadAsNewcomer('reload');
        },
      },
    };
  }

  publish();
  emit(createdVisitor ? 'visitor:new' : 'visitor:returning', visitor.id);
})();
