import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Products SPA',
  description: 'Single Page Application для управления продуктами',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

