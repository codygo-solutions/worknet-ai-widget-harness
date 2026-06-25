import type { GetServerSideProps } from 'next';

import CPagesNav from '../../app/_components/CPagesNav';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function CPagesPricing(): React.JSX.Element {
  return (
    <main className="wrap">
      <p className="crumb">Pages Router · soft-nav via Router</p>
      <CPagesNav />
      <h1>Pricing</h1>
      <p>
        Soft-navigated via the Pages Router. <code>routeChangeComplete</code> fired; the widget did
        not re-<code>/load</code>. nav-probe shows the same ✗(now) as C-app.
      </p>
    </main>
  );
}
