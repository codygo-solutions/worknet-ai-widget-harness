import type { GetServerSideProps } from 'next';

import CPagesNav from '../../../app/_components/CPagesNav';

type Props = { slug: string };

// Pages-Router params arrive synchronously via the SSR context.
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = typeof ctx.params?.slug === 'string' ? ctx.params.slug : 'unknown';
  return { props: { slug } };
};

export default function CPagesSolution({ slug }: Props): React.JSX.Element {
  return (
    <main className="wrap">
      <p className="crumb">Pages Router · dynamic route</p>
      <CPagesNav />
      <h1>Solution: {slug}</h1>
      <p>
        Dynamic Pages-Router route, SSR on direct hit (<code>__NEXT_DATA__</code> carries{' '}
        <code>slug</code>), soft-nav on in-app link.
      </p>
    </main>
  );
}
