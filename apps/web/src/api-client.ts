import { configureApiClient } from '@antin-os/api-client';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

configureApiClient({ baseUrl: API_BASE_URL });

export * from '@antin-os/api-client';
