import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Widget Tenant-Site Simulator',
  description: 'Embeds the real chat/AI widget across customer-site navigation archetypes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
