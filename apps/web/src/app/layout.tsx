import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriMax',
  description: 'Gestión nutricional para profesionales',
  appleWebApp: {
    capable: true,
    title: 'NutriMax',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
