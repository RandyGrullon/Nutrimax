import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1a73e8' },
    { media: '(prefers-color-scheme: dark)', color: '#131314' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className={`${inter.className} min-h-dvh`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
