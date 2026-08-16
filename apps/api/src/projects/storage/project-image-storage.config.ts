export type ProjectImageStorageConfig = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
  presignedUrlTtlSeconds: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for project-image storage`);
  }

  return value;
}

export function getProjectImageStorageConfig(): ProjectImageStorageConfig {
  const ttl = Number(process.env.AWS_S3_PRESIGNED_URL_TTL_SECONDS ?? '900');

  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error(
      'AWS_S3_PRESIGNED_URL_TTL_SECONDS must be a positive integer',
    );
  }

  return {
    region: requireEnv('AWS_REGION'),
    bucket: requireEnv('AWS_S3_BUCKET'),
    accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL,
    presignedUrlTtlSeconds: ttl,
  };
}
