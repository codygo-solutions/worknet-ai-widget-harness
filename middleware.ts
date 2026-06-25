import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Request-time logic for the three sections that need it:
//  - /h-hostile/*  : fresh per-request nonce + strict header-delivered CSP whose
//                    script/connect allowlist is derived from the SAME runtime
//                    config the browser embed reads (one truth, no compiled-in
//                    repo specifics).
//  - /c-pages/*    : re-add `X-Powered-By: Next.js` (Pages Router fingerprint;
//                    poweredByHeader:false stripped it globally).
//  - /c-hybrid/*   : reinforce the App-Router RSC `Vary` fingerprint.
//
// Edge runtime: no `fs`. The allowlist is fetched over HTTP from the static
// public/ file (the matcher excludes that path, so this is not recursive).
// Caches are module-scoped — per-V8-isolate best-effort, not cross-worker;
// good enough for a dev harness. The in-flight map dedups concurrent
// cold-start fetches within an isolate.
//
// Only the real widget-runtime.json feeds the CSP allowlist — never the
// committed *.example.json placeholder (its REPLACE_WITH_/localhost values
// would silently produce a wrong, unreliable CSP).

type RuntimeConfig = {
  widgetKey?: string;
  embedScriptUrl?: string;
  apiBaseUrl?: string;
  chatAppBaseUrl?: string;
};

const cache = new Map<string, { at: number; cfg: RuntimeConfig }>();
const inflight = new Map<string, Promise<RuntimeConfig>>();
const TTL_MS = 5_000;

async function fetchRuntimeConfig(origin: string): Promise<RuntimeConfig> {
  const res = await fetch(`${origin}/widget-runtime.json`, {
    cache: 'no-store',
  }).catch(() => undefined);
  if (res?.ok) {
    return (await res.json().catch(() => ({}))) as RuntimeConfig;
  }
  // Visible, not swallowed: a missing/unreadable config yields a minimal CSP
  // (self + nonce + strict-dynamic only) — the widget may be blocked, which
  // is the correct, diagnosable signal rather than a silently wrong allowlist.
  console.warn(
    `[middleware] widget-runtime.json unavailable at ${origin} — H CSP allowlist will be minimal`,
  );
  return {};
}

async function loadRuntimeConfig(origin: string): Promise<RuntimeConfig> {
  const now = Date.now();
  const hit = cache.get(origin);
  if (hit && now - hit.at < TTL_MS) return hit.cfg;

  let pending = inflight.get(origin);
  if (!pending) {
    pending = fetchRuntimeConfig(origin).then((cfg) => {
      cache.set(origin, { at: Date.now(), cfg });
      inflight.delete(origin);
      return cfg;
    });
    inflight.set(origin, pending);
  }
  return pending;
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function wsOriginOf(url: string | undefined): string | undefined {
  const o = originOf(url);
  if (!o) return undefined;
  return o.replace(/^http/, 'ws');
}

function uniq(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v)));
}

function buildCsp(nonce: string, cfg: RuntimeConfig): string {
  const embedOrigin = originOf(cfg.embedScriptUrl);
  const apiOrigin = originOf(cfg.apiBaseUrl);
  const chatOrigin = originOf(cfg.chatAppBaseUrl);

  // `next dev` HMR / Fast Refresh evaluates strings as JS, which a strict
  // nonce-only script-src correctly blocks. The widget itself never needs
  // eval; this is purely Next's dev runtime. Production (`next build/start`)
  // emits no eval, so the simulated CSP stays genuinely strict there — this
  // is the standard Next nonce-CSP dev accommodation.
  const devEval = process.env.NODE_ENV !== 'production' ? ["'unsafe-eval'"] : [];
  const scriptSrc = uniq([`'nonce-${nonce}'`, "'strict-dynamic'", ...devEval, embedOrigin]).join(
    ' ',
  );

  const connectSrc = uniq([
    "'self'",
    apiOrigin,
    chatOrigin,
    embedOrigin,
    wsOriginOf(cfg.apiBaseUrl),
    wsOriginOf(cfg.chatAppBaseUrl),
    // Vite dev server opens an HMR websocket to its own origin; without this
    // the widget still loads but spurious CSP reports muddy the H signal.
    wsOriginOf(cfg.embedScriptUrl),
  ]).join(' ');

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `connect-src ${connectSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    'report-uri /h-hostile/csp-report',
  ].join('; ');
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, origin } = request.nextUrl;

  if (pathname.startsWith('/h-hostile')) {
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const cfg = await loadRuntimeConfig(origin);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', buildCsp(nonce, cfg));
    return response;
  }

  if (pathname.startsWith('/c-pages')) {
    const response = NextResponse.next();
    response.headers.set('X-Powered-By', 'Next.js');
    return response;
  }

  if (pathname.startsWith('/c-hybrid')) {
    // Reinforce the App-Router RSC Vary fingerprint deterministically.
    const response = NextResponse.next();
    response.headers.set('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch');
    return response;
  }

  // Explicit pass-through: any future matcher path must opt into a fingerprint
  // above rather than silently inheriting the App-Router Vary header.
  return NextResponse.next();
}

export const config = {
  matcher: ['/h-hostile/:path*', '/c-pages/:path*', '/c-hybrid/:path*'],
};
