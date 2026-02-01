import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Empire Portal | Keystone Business Group',
  description: 'Unified command center for managing 6 entities, 30+ bank accounts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
