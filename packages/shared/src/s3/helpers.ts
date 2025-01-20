export function getBucketURL(): string {
  return import.meta.env.VITE_AWS_S3_BUCKET_PUBLIC_URL;
}
