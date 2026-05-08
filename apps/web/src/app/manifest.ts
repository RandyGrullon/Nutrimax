import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NutriMax',
    short_name: 'NutriMax',
    description: 'Gestión nutricional: pacientes, dietas e historial',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#15803d',
    lang: 'es',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
