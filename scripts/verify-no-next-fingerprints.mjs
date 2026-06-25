#!/usr/bin/env node
/*
 * verify-no-next-fingerprints.mjs — the non-Next archetypes MUST carry zero
 * Next fingerprints, or the widget (which keys off exactly these markers)
 * would misclassify them and the whole simulation is pointless (doc §6.1
 * "Discipline, review-enforced").
 *
 * Fails (exit 1) if any file under public/{a-mpa,b1-spa,b2-spa,f-mfe,g-turbo}
 * contains: /_next/, __next_f, __NEXT_DATA__, next-router-state-tree, or
 * imports @worknet/* / ../app.
 *
 * No dependencies — Node stdlib only.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NON_NEXT = ['a-mpa', 'b1-spa', 'b2-spa', 'f-mfe', 'g-turbo', 'i-dom-automation'];
const FORBIDDEN = [
  '/_next/',
  '__next_f',
  '__NEXT_DATA__',
  'next-router-state-tree',
  '@worknet/',
  '@codygo-ai/',
];

const problems = [];

function scan(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      scan(full);
      continue;
    }
    // Binary-ish assets (fonts/images) can't carry these markers meaningfully.
    if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(entry)) continue;
    const text = readFileSync(full, 'utf8');
    const rel = full.slice(root.length + 1);
    for (const marker of FORBIDDEN) {
      if (text.includes(marker)) {
        problems.push(`${rel} contains forbidden Next/monorepo fingerprint: ${marker}`);
      }
    }
    if (/from ['"]\.\.\/app['"]|require\(['"]\.\.\/app['"]\)/.test(text)) {
      problems.push(`${rel} imports ../app — non-Next bundles must be standalone`);
    }
  }
}

for (const section of NON_NEXT) {
  const dir = join(root, 'public', section);
  if (existsSync(dir)) scan(dir);
}

if (problems.length) {
  console.error('✗ no-next-fingerprint verification FAILED:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('✓ non-Next archetypes are clean — zero /_next/ fingerprints');
