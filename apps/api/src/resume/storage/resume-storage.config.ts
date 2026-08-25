export type ResumeStorageConfig = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for resume storage`);
  }

  return value;
}

export function getResumeStorageConfig(): ResumeStorageConfig {
  return {
    region: requireEnv('AWS_REGION'),
    bucket: requireEnv('AWS_S3_BUCKET'),
    accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
  };
}
