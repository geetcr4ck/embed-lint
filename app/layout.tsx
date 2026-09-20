import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EmbedLint',
  description: 'Builder and validator for Discord Component Embeds (client-side).',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
