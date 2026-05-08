import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // Datos clínicos viven en Nest/Supabase (origen distinto): no añadir runtime cache genérico para esas URLs.
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nutrimax/shared'],
};

export default withPWA(nextConfig);
