// Next 15 — dynamic route params are async.
export default async function CHybridSolution({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  return (
    <>
      <h1>Solution: {slug}</h1>
      <p>
        A parameterised App-Router route, server-rendered on direct hit and soft-navigated on in-app{' '}
        <code>&lt;Link&gt;</code> — same regression either way once you navigate within the app.
      </p>
    </>
  );
}
