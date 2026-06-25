import type { GetServerSideProps } from 'next';

import CPagesNav from '../../app/_components/CPagesNav';

type Props = { renderedAt: string };

// getServerSideProps forces SSR and serialises props into the
// <script id="__NEXT_DATA__"> payload — the Pages-Router fingerprint.
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return { props: { renderedAt: new Date().toISOString() } };
};

export default function CPagesHome({ renderedAt }: Props): React.JSX.Element {
  return (
    <main className="wrap">
      <p className="crumb">Pages Router · __NEXT_DATA__ · Router.events · x-powered-by: Next.js</p>
      <CPagesNav />
      <h1>Acme (Pages Router)</h1>
      <p>
        Server-rendered at <code>{renderedAt}</code> via <code>getServerSideProps</code>. The
        hydration payload is in
        <code> __NEXT_DATA__</code>; <code>Router.events</code> fires on soft-nav. Different router
        model from C-app — same soft-nav regression.
      </p>
    </main>
  );
}
