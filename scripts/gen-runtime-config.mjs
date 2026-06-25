#!/usr/bin/env node
/*
 * gen-runtime-config.mjs — OPTIONAL convenience, runs as `predev`.
 *
 * Pure no-op unless ALL of:
 *   - public/widget-runtime.json does NOT already exist (never clobber a
 *     developer's real wk_ key + URLs), AND
 *   - the monorepo dev-env env file exists at <worktree>/.tmp/dev-env/env
 *
 * Then it writes public/widget-runtime.json with the live slot ports so a
 * developer already running the monorepo dev-env gets working URLs for free.
 * It still cannot invent a widgetKey — that stays REPLACE_WITH_wk_KEY and the
 * nav-probe surfaces the (expected) "set ?wk=" banner until one is supplied.
 *
 * Standalone (lifted to its own repo): the env file is absent → clean no-op.
 * No imports, no @worknet/aws — it only reads an env file.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'widget-runtime.json');

if (existsSync(target)) {
  process.exit(0); // developer-owned — never overwrite
}

// client/apps/widget-harness → ../../../ is the worktree root
const envFile = join(root, '..', '..', '..', '.tmp', 'dev-env', 'env');
if (!existsSync(envFile)) {
  process.exit(0); // standalone / no dev-env — clean no-op
}

const env = {};
for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^\s*export\s+([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const chatWidgetPort = env.WN_CHAT_WIDGET_PORT;
if (!chatWidgetPort) {
  process.exit(0); // incomplete env — leave it to the example file
}

// Only the embed (where the widget code loads from) needs the dev-env; the
// widget infers apiBaseUrl/chatAppBaseUrl from this origin — no overrides.
const cfg = {
  widgetKey: 'REPLACE_WITH_wk_KEY',
  embedScriptUrl: `http://localhost:${chatWidgetPort}/src/main.tsx`,
  embedScriptType: 'module',
};
writeFileSync(target, JSON.stringify(cfg, null, 2) + '\n');
console.log(
  `[gen-runtime-config] wrote public/widget-runtime.json from dev-env ` +
    `(widget:${chatWidgetPort}) — set a real widgetKey via ?wk= or by editing the file.`,
);
