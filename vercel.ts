import type { VercelConfig } from '@vercel/config/v1';

const renderApiOrigin = '$RENDER_API_ORIGIN';

const noStoreHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store, max-age=0, must-revalidate',
  },
  {
    key: 'CDN-Cache-Control',
    value: 'no-store',
  },
  {
    key: 'Vercel-CDN-Cache-Control',
    value: 'no-store',
  },
];

const config: VercelConfig = {
  framework: 'vite',
  installCommand: 'pnpm install --frozen-lockfile',
  buildCommand: 'VITE_API_BASE_URL=/api pnpm --filter web build',
  outputDirectory: 'apps/web/dist',
  headers: [
    {
      source: '/api/:path*',
      headers: noStoreHeaders,
    },
  ],
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${renderApiOrigin}/:path*`,
      env: ['RENDER_API_ORIGIN'],
      respectOriginCacheControl: false,
    },
    {
      source: '/:path*',
      destination: '/index.html',
    },
  ],
};

export default config;
