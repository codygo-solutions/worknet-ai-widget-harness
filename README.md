# Widget Tenant-Site Simulator

A **standalone** Next.js app that embeds the real Worknet chat/AI widget across the navigation models customer sites use. Each section imitates a different host archetype (MPA, SPA, Next hybrid, strict CSP, etc.). An on-page **nav-probe** (bottom-right) records hard vs soft navigation, widget mount count, and an **Expected vs Actual** table.

**Live demo:** [https://worknet-ai-widget-harness.vercel.app](https://worknet-ai-widget-harness.vercel.app)

**Repo:** [github.com/codygo-solutions/worknet-ai-widget-harness](https://github.com/codygo-solutions/worknet-ai-widget-harness)

---

## Quick start

```bash
npm install
cp public/widget-runtime.example.json public/widget-runtime.json   # optional for local dev
npm run dev                # http://localhost:5176/
```

Open the directory, pick a section, and pass a widget key:

```
http://localhost:5176/?wk=wk_YOUR_KEY
```

For a hosted Worknet stage, admin passes `wk`, `api`, `chat`, and `embed` automatically (see [Admin integration](#admin-integration)).

---

## Admin integration

Deployed admin includes `widgetHarnessUrl` in `__RUNTIME_ENV__.js` (injected at CDK deploy). For any **widget** chat app:

1. **Preview → Tenant harness** — iframes the hosted harness with that widget’s `wk_…` key and the current stage’s API/chat/embed URLs.
2. **Open in harness** — opens the harness in a new tab with the same params.

Local admin dev: harness runs on `http://localhost:5176` when you use full `pnpm dev` in the monorepo, or start this app standalone.

---

## Runtime config

Config precedence: **query params** → **localStorage** → **`public/widget-runtime.json`**.

| Param / field | Purpose |
|---------------|---------|
| `wk` / `widgetKey` | Widget key (`wk_…`) — required to load the widget |
| `embed` / `embedScriptUrl` | Where to load widget code (e.g. `…/chat-widget/embed.js`) |
| `api` / `apiBaseUrl` | API origin override (optional; usually inferred from embed) |
| `chat` / `chatAppBaseUrl` | Chat app origin override (SSO; optional) |

Example direct URL:

```
https://worknet-ai-widget-harness.vercel.app/?wk=wk_…&embed=https://app.worknet.ai/chat-widget/embed.js&api=https://api.worknet.ai&chat=https://app.worknet.ai
```

`public/widget-runtime.json` is gitignored. Copy from `widget-runtime.example.json` for local defaults. **Section H** (hostile CSP) builds its allowlist from this file only — query/localStorage overrides do not apply on H.

---

## Sections (A–I)

Open the **nav-probe** on every section. It shows hard-reload vs soft-nav counts, nav event log, `<chat-widget>` mount count, and Expected vs Actual.

### A — Classic MPA (`/a-mpa`)

**Simulates:** WordPress, Webflow, HubSpot, AEM-style server MPAs.

**How to use:** Click section links (About, Pricing, etc.). Each link is a full page load.

**What to watch:** Hard-reload count rises on every click; a new `/load` fires per navigation → journey **✓**.

---

### B1 — SPA · HTML5 history (`/b1-spa/`)

**Simulates:** React/Vue router with `history.pushState`.

**How to use:** Use in-app nav links (Home → Pricing → Docs). URL changes without full reload.

**What to watch:** Soft-nav count rises; hard stays 1; no new `/load` on in-app nav → journey **✗(now)**.

---

### B2 — SPA · hash router (`/b2-spa/`)

**Simulates:** Hash-based routing (`#/pricing`).

**How to use:** Click nav links; watch `hashchange` in the probe log.

**What to watch:** Same as B1 — soft navigation without journey signal → **✗(now)**.

---

### C·app — Hybrid App Router (`/c-hybrid`)

**Simulates:** Next.js App Router (RSC, `/_next/` assets).

**How to use:** Click `<Link>` routes in the section shell.

**What to watch:** Soft client navigations; journey **✗(now)** until widget History instrumentation lands.

---

### C·pg — Hybrid Pages Router (`/c-pages`)

**Simulates:** Next.js Pages Router (`__NEXT_DATA__`, `Router.events`, `X-Powered-By: Next.js`).

**How to use:** Navigate between pages via Next `<Link>`.

**What to watch:** Same soft-nav / stale context pattern → **✗(now)**.

---

### D — Docs SPA (`/d-docs`)

**Simulates:** Docusaurus/Mintlify-shaped docs site.

**How to use:** Open AI helper on page 1, soft-nav to page 2.

**What to watch:** Helper found on p1, not re-found after soft-nav → **✗(now)**.

---

### E — Auth-gated app (`/e-auth/login`)

**Simulates:** Login wall then in-app shell.

**How to use:** Start logged out → log in → navigate inside the shell.

**What to watch:** Re-identify on login full-nav works; in-shell soft-nav → **✗(now)**.

---

### F — Micro-frontend (`/f-mfe/`)

**Simulates:** single-spa shell; widget survives MFE unmount.

**How to use:** Navigate between MFE routes; probe dedupes double `popstate`.

**What to watch:** Widget stays at 1 mount across MFE lifecycle.

---

### G — Turbo MPA trap (`/g-turbo`)

**Simulates:** Turbo/htmx — looks like WordPress/nginx MPA but soft-navs.

**How to use:** Click links; headers look like server MPA.

**What to watch:** Hard count stays 1 (the trap) — soft-nav without journey signal → **✗(now)**.

---

### H — Hostile host (`/h-hostile`)

**Simulates:** Strict nonce CSP, Shadow DOM, competing third-party widget.

**How to use:** Requires `widget-runtime.json` with real `embedScriptUrl`, `apiBaseUrl`, `chatAppBaseUrl` for your stage (Vercel build env or local file). Query overrides are **ignored** for CSP.

**What to watch:** Widget still loads under nonce-CSP; `csp-report` shows 0 violations when configured correctly.

---

### I — DOM automation testbed (`/i-dom-automation`)

**Simulates:** Hostile DOM for RPA/agent eval (shadow DOM, traps, iframes, wizards).

**How to use:** Open `/i-dom-automation` or section I from the directory. Optional sidecar: `dom-testbed/` mock MCP + REST (`npm start` in that dir → `:3000`).

**What to watch:** Single full-load page → journey **✓**.

---

## Nav-probe

Fixed panel, bottom-right on every section:

- Hard vs soft navigation counts
- Nav event log (`popstate`, `hashchange`, etc.)
- `<chat-widget>` mount count
- **Expected vs Actual** table (doc §7 matrix)

The **✗(now)** column is expected today: the widget has no History instrumentation, so soft-nav archetypes keep stale page context. When the widget History fix ships, those cells flip green **without changing this harness**.

---

## Development

```bash
npm run verify      # isolation + no-next-fingerprint gates
npm run lint
npm run typecheck
npm run build
npm run start       # production server on :5176
```

**`build:bundles`** — only if you change `_bundle-src/` (Vite SPAs for B1/B2). Built output under `public/b1-spa` and `public/b2-spa` is committed.

---

## Deployment

Hosted on **Vercel**. Push to `main` → automatic production deploy.

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Install | `npm ci` |
| Build | `npm run build` |
| Node | 24.x |

**CI:** `.github/workflows/ci.yml` runs `verify`, `lint`, `typecheck`, and `build` on PRs and `main`.

**Optional Vercel env vars** (for section H): `WIDGET_KEY`, `EMBED_URL`, `API_URL`, `CHAT_URL` — use a build step to write `public/widget-runtime.json` if you need H on the hosted instance.

---

## Architecture

| Path | Role |
|------|------|
| `app/` | Next App Router — SSR/RSC sections (C-app, D, E, H) + directory |
| `pages/` | Pages Router — C-pages variant |
| `public/` | Static archetypes (A, B1, B2, F, G, I) — zero `/_next/` fingerprints |
| `middleware.ts` | CSP nonces (H), fingerprint headers (C-pages, C-app) |
| `public/shared/` | `nav-probe.js`, `embed-bootstrap.js`, `expected.js` — shared by all sections |
| `_bundle-src/` | Isolated Vite project → B1/B2 bundles |

Zero coupling to the Worknet monorepo — own `package-lock.json`, no `@worknet/*` deps. Liftable as-is.

---

## Monorepo note

This app also lives at `client/apps/widget-harness` in [worknet-ai-mono](https://github.com/codygo-solutions/worknet-ai-mono) for co-development. The standalone repo is the deployment source of truth.
