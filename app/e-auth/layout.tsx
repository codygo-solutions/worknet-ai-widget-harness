// Passthrough — the login document and the authenticated shell own their own
// chrome. Kept so /e-auth/* is a coherent route group.
export default function EAuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
}
