import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Homebrew Recipe Studio',
    short_name: 'Brew Studio',
    description:
      'Open-source all-grain, BIAB, honey & sugar homebrew recipe formulator, inventory manager, water chemistry calculator, and brewer log.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
