# DOM Automation Testbed — Mock MCP Server

Optional sidecar mock MCP + REST API for exercising widget tool-calling against a local endpoint. The **testbed page** itself is served by the widget-harness at `/i-dom-automation` — see [`../public/i-dom-automation/index.html`](../public/i-dom-automation/index.html).

## Testbed page (via widget-harness)

```bash
cd client/apps/widget-harness
npm install
cp public/widget-runtime.example.json public/widget-runtime.json   # set widgetKey + local URLs
npm run dev                # http://localhost:5176/
```

Open **http://localhost:5176/i-dom-automation** (or click section **I** on the directory). Widget config comes from `public/widget-runtime.json` or `?wk=` query params — same as every other harness section.

## Mock MCP server (optional sidecar)

```bash
cd client/apps/widget-harness/dom-testbed
npm install
npm start                  # http://localhost:3000
```

Override port with `PORT=<n> node index.js`.

### Authentication

All `/mcp` requests require an `Authorization` header:

```
Authorization: Bearer codygo-qa-token-123
```

Requests without the correct token receive `401 Unauthorized`.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/mcp` | MCP JSON-RPC endpoint (tool discovery + execution) |
| `GET` | `/api/users` | List users; optional `?role=admin\|engineer\|viewer` filter |
| `POST` | `/api/tickets` | Create a ticket (`{ title, priority }` required) |
| `GET` | `/openapi.json` | OpenAPI 3.0 spec for the REST endpoints |
| `GET` | `/health` | Health check — `{ status: "ok" }` |

### MCP tools

| Tool | Input | What it does |
|------|-------|-------------|
| `calculate_server_load` | `{ instances: number }` | Returns a mock load % across N instances |
| `fetch_error_logs` | `{ service_name: string, severity: "warn"\|"error"\|"critical" }` | Returns a canned log count for the service |
| `restart_container` | `{ container_id: string }` | Simulates a container restart |

## Testbed page sections

The page at `/i-dom-automation` includes 12 difficulty-tagged DOM sections for browser automation, RPA, and agent eval development:

| Section | Difficulty tags | What makes it hard |
|---------|----------------|-------------------|
| **Dynamic content** | `async`, `mutate` | Content loads after a random 1–4s delay; the mount node's `id` and `class` rotate every 6s |
| **Shadow DOM** | *(implicit)* | Two web components nest 3 levels of login forms inside open and closed shadow roots |
| **Registration wizard** | *(multi-step)* | 4-step wizard with no URL routing; custom dropdown, range slider, drag-and-drop file chips |
| **Bot traps** | `trap` | Hidden honeypot fields; submit button shifts on hover; 3s rate limit after each submission |
| **Iframe panel** | `iframe` | `srcdoc` iframe with checkboxes; changes sent via `postMessage` |
| **Branching choice** | `branching` | Three paths that swap a sub-view |
| **View switcher** | `viewswap` | Tab bar replaces content area — automation aids become stale after tab click |
| **Modal dialog** | `modal` | Centered overlay with form fields, focus trap, backdrop dismiss |
| **Search / filter** | `filter` | Live-filtered list — items appear/disappear as you type |
| **Delayed content** | `async-load` | Content arrives ~2s after clicking "Load report" |
| **Below the fold** | `scroll` | Target button sits 70 vh below the viewport |
| **Event log** | *(utility)* | Append-only log of automation-relevant events |
