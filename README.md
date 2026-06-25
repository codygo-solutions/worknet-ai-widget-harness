# widget-harness — Widget Tenant-Site Simulator

A **standalone** test harness that embeds the real chat/AI widget across the
navigation models real customer sites use, with an on-page `nav-probe` that
shows pass / `✗(now)` per the doc §7 matrix.

It imitates *external customer sites*, so it has **zero coupling to this
monorepo** — own npm lockfile, no `@worknet/*` deps, standalone
tsconfig/eslint. The whole directory is `cp -r`-portable to its own repo
unedited. It deliberately does **not** use the worknet design system.

## Run it (standalone — primary)

```bash
cd client/apps/widget-harness
npm install
cp public/widget-runtime.example.json public/widget-runtime.json   # then edit
npm run build:bundles      # one-time: _bundle-src → public/b1-spa, b2-spa
                           # (committed output already present — only needed
                           #  if you change _bundle-src)
npm run dev                # next dev; open http://localhost:5176/
npm run verify             # isolation + no-next-fingerprint gates
npm run lint && npm run typecheck
```

### Runtime config

Like a real customer embed, the harness needs only a **widget key** — it infers
the backend (`apiBaseUrl`/`chatAppBaseUrl`) from the embed script's origin. The
git-ignored `public/widget-runtime.json` (copy it from
`widget-runtime.example.json`) carries the key plus where to load the widget
code from:

```json
{
  "widgetKey": "wk_…",
  "embedScriptUrl": "http://localhost:5175/src/main.tsx",
  "embedScriptType": "module"
}
```

- `embedScriptUrl` = the widget's dev script (the chat-widget Vite dev origin)
  or a built `embed.js`. Defaults to the local chat-widget dev server (one port
  below the harness) when omitted, so a bare `?wk=` works on its own.
- `apiBaseUrl` / `chatAppBaseUrl` are **optional dev overrides** — only set them
  to point at a non-inferable backend. The widget otherwise infers both from the
  embed origin (`apiBaseUrl` drives load, logs, and the chat socket;
  `chatAppBaseUrl` is SSO-only).

The widget key (and any override) is also settable per-visit via query params —
the embed persists them to `localStorage` so you only pass them once:

```
http://localhost:5176/?wk=wk_…
```

There is **no seeded widgetKey**. Create a `type: 'widget'` chat app in the
admin app (with the backend running) and paste its `wk_…` into
`widget-runtime.json` (or pass `?wk=`). Until then the nav-probe shows a clear
"set ?wk=" banner.

## What you're looking at

Open the **nav-probe** (bottom-right, every section). For each archetype it
shows hard-reload vs soft-nav counts, the nav event log, the
`<chat-widget>` mount count, and an **Expected vs Actual** table encoding
doc §7.

| § | Archetype | Decisive observation |
|---|---|---|
| A | Classic MPA (WP/Webflow/HubSpot/AEM) | each link = hard reload + **new `/load`** → journey ✓ |
| B1 | SPA · HTML5 history | soft-navs rise, hard stays 1, no new `/load` → **✗(now)** |
| B2 | SPA · hash router | `hashchange` logged, journey **✗(now)** |
| C·app | Hybrid App Router (RSC) | real `/_next/`+`self.__next_f`; `<Link>` → **✗(now)** |
| C·pg | Hybrid Pages Router | `__NEXT_DATA__`+`Router.events`+`x-powered-by`; → **✗(now)** |
| D | Docs SPA | AI-helper found p1, not re-found after soft-nav **✗(now)** |
| E | Auth-gated app | loads pre-auth → re-identify on login full-nav → in-shell **✗(now)** |
| F | Micro-frontend (single-spa) | double-`popstate` de-duped; widget survives MFE unmount (1 mount) |
| G | Turbo MPA-as-soft-nav | DOM/headers look like WordPress but hard stays 1 (the **trap**) |
| H | Hostile host (strict CSP) | widget **still loads** under nonce-CSP; Shadow DOM blocks bleed CSS; competing widget coexists; `csp-report` shows 0 |
| I | DOM automation testbed | intentionally hostile DOM patterns (shadow DOM, traps, iframes, wizards) for RPA/agent eval; single full-load page → journey **✓** |

> **H requires `public/widget-runtime.json`.** Section H's CSP allowlist is
> built server-side from that file only — `?api=`/`?chat=`/`localStorage`
> embed overrides are invisible to the middleware, so a widget pointed
> elsewhere via query/localStorage will be CSP-blocked on H. Set the real
> origins in `widget-runtime.json` before exercising H.

The whole `✗(now)` column is the headline result: the widget has **no
History instrumentation**, so on every soft-nav archetype it keeps stale
page context and emits no page-change journey signal. When the separate
widget History fix lands, those cells flip green **with this harness
unchanged** — the probe observes real `/load` traffic, it is not wired to
the widget internals.

## Architecture

- `app/` — Next App Router: real SSR/RSC sections (C-app, D, E, H) + the
  section directory shell.
- `pages/` — Pages Router (the C-pages variant — `__NEXT_DATA__` /
  `Router.events`).
- `public/` — non-Next archetypes (A, B1, B2, F, G, I) and the shared
  scripts. **Zero `/_next/` fingerprints** here, enforced by
  `scripts/verify-no-next-fingerprints.mjs`.
- `dom-testbed/` — optional sidecar mock MCP + REST server (`npm start` in
  that dir → `:3000`). The testbed page itself lives at
  `public/i-dom-automation/index.html` and is served by the harness at
  `/i-dom-automation`.
- `_bundle-src/` — a second isolated npm project (own lockfile + Vite) that
  builds the B1 (history) and B2 (hash) React-Router SPAs into
  `public/b1-spa` / `public/b2-spa`. **Built output is committed** so
  `npm run dev` needs no build step.
- `middleware.ts` — per-request nonce CSP for H (allowlist derived from the
  same runtime config the browser embed reads), plus the C-pages /
  C-app header fingerprints.
- `public/shared/{nav-probe,expected,embed-bootstrap}.js` — the identical
  embed + the observe-only instrumentation, used verbatim by every section.

## Monorepo dev-env auto-start (optional convenience)

Standalone is the primary mode. On bare/full `pnpm dev` (all services), the
dev supervisor also starts the harness on `.pipeline/ports.json`
`WIDGET_HARNESS` (default `:5176`). Presets such as `pnpm dev admin` or
`pnpm dev chat` do **not** start it. Opt out with `WN_DEV_WIDGET_HARNESS=0`
in your root `.env`.

In that mode the `predev` `gen-runtime-config.mjs` writes `widget-runtime.json`
from the live slot ports when the file does not already exist (you still
supply a real `widgetKey`). With no dev-env present that script is a clean
no-op — nothing about standalone mode depends on the monorepo.

Admin widget Preview can switch to **Tenant harness** when running on
localhost; it iframes the harness with your saved `wk_…` key and dev URLs.

## Out of scope

Building the widget's History fix is a **separate issue**. Tier-2 (a real
Docusaurus static-export, a real Astro `<ClientRouter/>`) is a later
follow-up per the design doc §8.
