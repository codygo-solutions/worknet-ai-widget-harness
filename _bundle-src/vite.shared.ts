import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Shared shape for the B1/B2 standalone SPA builds. Absolute `base` so asset
// URLs stay correct no matter which deep URL the SPA-fallback rewrite served
// index.html for. `assets/index-[hash]` is the React-SPA(Vite) fingerprint
// (doc Appendix B); zero /_next/ by construction. Only the section slug
// differs between B1 (HTML5 history) and B2 (HashRouter).
export function makeSpaConfig(slug: 'b1-spa' | 'b2-spa') {
  const root = slug === 'b1-spa' ? 'b1' : 'b2';
  return defineConfig({
    plugins: [react()],
    root,
    base: `/${slug}/`,
    publicDir: false,
    build: {
      outDir: `../../public/${slug}`,
      emptyOutDir: true,
      modulePreload: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/index-[hash].js',
          chunkFileNames: 'assets/index-[hash].js',
          assetFileNames: 'assets/index-[hash][extname]',
        },
      },
    },
  });
}
