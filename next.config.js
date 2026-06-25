// Self-contained CommonJS config — no imports from the surrounding monorepo.
// Next is only a rendering/header host here: real SSR/RSC for the native-Next
// archetypes, per-route fingerprint headers, and the section-directory shell.
// Non-Next archetypes live in public/ and carry zero /_next/ fingerprints.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The harness is a standalone island with its own lockfile sitting inside a
  // pnpm monorepo. Pin the tracing root to this dir so Next does not infer the
  // monorepo root (multi-lockfile warning) — also keeps the package liftable.
  outputFileTracingRoot: __dirname,

  // Strip Next's own `x-powered-by: Next.js`. Sections that must look like
  // WordPress/nginx re-shape Server/X-Powered-By in headers() / middleware.
  poweredByHeader: false,

  async rewrites() {
    return {
      // beforeFiles runs before the filesystem. Nothing belongs here: a
      // catch-all SPA fallback here would shadow the real built JS assets
      // under public/b1-spa/assets/. SPA fallback is afterFiles by design.
      beforeFiles: [],

      afterFiles: [
        // Clean-URL maps so the A (WordPress/AEM) and G (Turbo) URL bars look
        // like a real server MPA: /a-mpa/about -> /a-mpa/about.html. The bare
        // section root maps to its index.html.
        { source: '/a-mpa', destination: '/a-mpa/index.html' },
        { source: '/a-mpa/:slug', destination: '/a-mpa/:slug.html' },
        { source: '/g-turbo', destination: '/g-turbo/index.html' },
        { source: '/g-turbo/:slug', destination: '/g-turbo/:slug.html' },
        { source: '/i-dom-automation', destination: '/i-dom-automation/index.html' },

        // SPA history-fallback for the two standalone Vite bundles. afterFiles
        // means real files (index.html, assets/index-<hash>.js) are served by
        // the filesystem first; only unknown deep links like /b1-spa/pricing
        // fall through to index.html — exactly SPA history-fallback semantics.
        // The bundles are built with an absolute Vite base so asset URLs stay
        // correct no matter which deep URL served index.html.
        { source: '/b1-spa/:path*', destination: '/b1-spa/index.html' },
        { source: '/b2-spa/:path*', destination: '/b2-spa/index.html' },
        // F single-spa shell: real MFE shells ship a history-fallback so deep
        // routes resolve to the shell. (A/G/H deliberately get none.)
        { source: '/f-mfe', destination: '/f-mfe/index.html' },
        { source: '/f-mfe/:path*', destination: '/f-mfe/index.html' },
      ],

      // No fallback for A / G / H — a real MPA 404s on unknown paths, and the
      // harness must reproduce that, not paper over it with a catch-all.
      fallback: [],
    };
  },

  async headers() {
    return [
      {
        // A — Classic MPA: present as Apache + PHP (WordPress sub-variant).
        source: '/a-mpa/:path*',
        headers: [
          { key: 'Server', value: 'Apache' },
          { key: 'X-Powered-By', value: 'PHP/8.2.18' },
        ],
      },
      {
        // G — Turbo/htmx MPA-as-soft-nav: nginx, no x-powered-by (the trap:
        // header-shaped like a server MPA, but it soft-navs).
        source: '/g-turbo/:path*',
        headers: [{ key: 'Server', value: 'nginx' }],
      },
      {
        // D — docs site shaped like a Vercel-hosted docs platform.
        source: '/d-docs/:path*',
        headers: [{ key: 'Server', value: 'Vercel' }],
      },
    ];
  },
};

module.exports = nextConfig;
