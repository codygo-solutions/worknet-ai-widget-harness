#!/usr/bin/env node
/*
 * verify-isolation.mjs — mechanical proof the harness has zero coupling to the
 * surrounding monorepo and is `cp -r`-portable to its own repo unedited.
 *
 * Fails (exit 1) if any of:
 *   - package.json references @worknet/* / @codygo-ai/* / workspace:
 *   - any source file imports @worknet/* / @codygo-ai/*
 *   - no committed npm lockfile (package-lock.json)
 *   - tsconfig.json `extends` something (would reach into the monorepo)
 *
 * No dependencies — Node stdlib only.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

const COUPLING = /@worknet\/|@codygo-ai\/|["']workspace:/;

// 1. package.json
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pkgRaw = JSON.stringify(pkg);
if (COUPLING.test(pkgRaw)) {
  problems.push('package.json references @worknet/* / @codygo-ai/* / workspace:');
}

// 2. committed npm lockfile
if (!existsSync(join(root, 'package-lock.json'))) {
  problems.push('package-lock.json missing — the npm lockfile is the isolation proof');
}

// 3. tsconfig must not extend into the monorepo
const tsconfig = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'));
if (tsconfig.extends) {
  problems.push(`tsconfig.json extends "${tsconfig.extends}" — must be standalone`);
}

// 4. source scan for @worknet/@codygo imports
// `scripts/` is the verifier tooling itself — it necessarily contains the
// marker strings as search patterns. The scan covers runtime source only.
const SKIP_DIRS = new Set(['node_modules', '.next', '_bundle-src', '.git', 'scripts']);
const SRC_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full);
      continue;
    }
    if (!SRC_EXT.test(entry)) continue;
    const text = readFileSync(full, 'utf8');
    if (/@worknet\/|@codygo-ai\//.test(text)) {
      problems.push(`${full.slice(root.length + 1)} imports/contains @worknet|@codygo-ai`);
    }
  }
}
walk(root);

// 5. _bundle-src is a second npm project that participates via build:bundles —
// it must be just as decoupled. Scanned separately from walk(root) so its own
// node_modules/dist are excluded but its package.json + source are checked.
const bundleSrc = join(root, '_bundle-src');
if (existsSync(bundleSrc)) {
  const bsPkgPath = join(bundleSrc, 'package.json');
  if (existsSync(bsPkgPath) && COUPLING.test(readFileSync(bsPkgPath, 'utf8'))) {
    problems.push('_bundle-src/package.json references @worknet/* / @codygo-ai/* / workspace:');
  }
  const BS_SKIP = new Set(['node_modules', 'dist']);
  (function walkBundle(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (!BS_SKIP.has(entry)) walkBundle(full);
        continue;
      }
      if (!SRC_EXT.test(entry)) continue;
      if (/@worknet\/|@codygo-ai\//.test(readFileSync(full, 'utf8'))) {
        problems.push(`${full.slice(root.length + 1)} imports/contains @worknet|@codygo-ai`);
      }
    }
  })(bundleSrc);
}

if (problems.length) {
  console.error('✗ isolation verification FAILED:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('✓ isolation verified — no monorepo coupling, npm lockfile present');
