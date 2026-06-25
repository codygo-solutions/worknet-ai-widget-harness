import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Standalone flat config — eslint + next plugin + react-hooks + typescript-eslint
// only. No monorepo eslint config is extended (the harness is liftable as-is).
export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', '_bundle-src/**', 'dom-testbed/**', 'public/**', 'next-env.d.ts'],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
      // The harness deliberately mixes hard <a href> nav (MPA archetypes) with
      // soft <Link> nav — testing both is the entire point. Next's "use Link"
      // lint would fight the simulation.
      '@next/next/no-html-link-for-pages': 'off',
      // Section H deliberately injects a raw hostile-host <link rel=stylesheet>
      // (host-bleed.css) to prove the widget's Shadow DOM isolates it. Next's
      // CSS-management lint is irrelevant to a hostile-host simulation.
      '@next/next/no-css-tags': 'off',
    },
  },
);
