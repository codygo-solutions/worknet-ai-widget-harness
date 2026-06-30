#!/usr/bin/env node
/*
 * gen-runtime-config.mjs — writes the server-visible widget runtime manifest.
 *
 * Section H builds a real header CSP before browser JS runs, so query params
 * and localStorage cannot extend its allowlist. This file is the shared
 * contract: middleware reads it for CSP, and embed-bootstrap reads it for the
 * browser-side widget config.
 *
 * Explicit env vars win and may overwrite the generated file:
 *   WIDGET_KEY, EMBED_URL, EMBED_TYPE, API_URL, CHAT_URL
 *
 * Without explicit URLs, local dev keeps the historical behavior: never
 * clobber an existing public/widget-runtime.json, and optionally generate a
 * convenience file from the surrounding monorepo dev-env when present.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'widget-runtime.json');
const lifecycle = process.env.npm_lifecycle_event || '';
const placeholderWidgetKey = 'REPLACE_WITH_wk_KEY';

function unquote(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m || m[1].startsWith('#')) continue;
    env[m[1]] = unquote(m[2]);
  }
  return env;
}

const fileEnv = {
  ...readEnvFile(join(root, '.env')),
  ...readEnvFile(join(root, '.env.local')),
};
const env = { ...fileEnv, ...process.env };

function pick(source, names) {
  for (const name of names) {
    const value = source[name];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
}

function writeConfig(cfg, reason) {
  writeFileSync(target, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`[gen-runtime-config] wrote public/widget-runtime.json from ${reason}.`);
}

function explicitConfig() {
  const widgetKey = pick(env, ['WIDGET_KEY']) || placeholderWidgetKey;
  const embedScriptUrl = pick(env, ['EMBED_URL']);
  const embedScriptType = pick(env, ['EMBED_TYPE']);
  const apiBaseUrl = pick(env, ['API_URL']);
  const chatAppBaseUrl = pick(env, ['CHAT_URL']);
  const anyExplicitUrl = Boolean(embedScriptUrl || apiBaseUrl || chatAppBaseUrl);

  if (!anyExplicitUrl) return undefined;

  const missing = [
    ['EMBED_URL', embedScriptUrl],
    ['API_URL', apiBaseUrl],
    ['CHAT_URL', chatAppBaseUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `incomplete hostile runtime config; missing ${missing.join(', ')}. ` +
        'Set EMBED_URL, API_URL, and CHAT_URL together.',
    );
  }

  return {
    widgetKey,
    embedScriptUrl,
    ...(embedScriptType ? { embedScriptType } : {}),
    apiBaseUrl,
    chatAppBaseUrl,
  };
}

const explicit = explicitConfig();
if (explicit) {
  writeConfig(explicit, 'env vars');
  process.exit(0);
}

if (existsSync(target)) {
  process.exit(0); // developer-owned — never overwrite
}

// client/apps/widget-harness → ../../../ is the worktree root
const envFile = join(root, '..', '..', '..', '.tmp', 'dev-env', 'env');
const devEnv = { ...env, ...readEnvFile(envFile) };

const chatWidgetPort = pick(devEnv, ['WN_CHAT_WIDGET_PORT']);
if (!chatWidgetPort) {
  if (lifecycle === 'prebuild' && process.env.VERCEL === '1') {
    throw new Error(
      'missing hostile runtime config for deployed build. ' +
        'Set EMBED_URL, API_URL, and CHAT_URL in the deployment environment.',
    );
  }
  process.exit(0); // standalone / no dev-env — clean no-op
}

const cfg = {
  widgetKey: pick(env, ['WIDGET_KEY']) || placeholderWidgetKey,
  embedScriptUrl: `http://localhost:${chatWidgetPort}/src/main.tsx`,
  embedScriptType: 'module',
};

const apiPort = pick(devEnv, ['WN_API_PORT', 'WN_BACKEND_PORT', 'WN_SERVER_PORT']);
if (apiPort) cfg.apiBaseUrl = `http://localhost:${apiPort}`;

const chatAppPort = pick(devEnv, [
  'WN_CHAT_APP_PORT',
  'WN_APP_PORT',
  'WN_WEB_APP_PORT',
  'WN_CHAT_PORT',
]);
if (chatAppPort) cfg.chatAppBaseUrl = `http://localhost:${chatAppPort}`;

writeConfig(cfg, `dev-env (widget:${chatWidgetPort})`);
