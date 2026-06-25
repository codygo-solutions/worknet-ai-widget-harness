import { Html, Head, Main, NextScript } from 'next/document';

// Custom Pages-Router document. NextScript emits the
// <script id="__NEXT_DATA__"> hydration payload — the Pages-Router
// fingerprint (doc Appendix B). x-powered-by: Next.js is re-added by
// middleware for /c-pages/*.
export default function Document(): React.JSX.Element {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
