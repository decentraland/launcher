import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { ListObjectsV2Output, S3ClientConfig } from '@aws-sdk/client-s3';
import { getBucketURL, RELEASE_PREFIX } from '#shared';
import { getOSName } from './ipc';

const BUCKET = import.meta.env.VITE_AWS_S3_BUCKET;

let config: S3ClientConfig = { retryMode: 'standard', maxAttempts: 3 };

if (import.meta.env.VITE_AWS_ACCESS_KEY_ID && import.meta.env.VITE_AWS_SECRET_ACCESS_KEY) {
  config = {
    ...config,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    },
  };
}

if (import.meta.env.VITE_AWS_ENDPOINT_URL) {
  config = {
    ...config,
    endpoint: import.meta.env.VITE_AWS_ENDPOINT_URL,
  };
}

if (import.meta.env.VITE_AWS_DEFAULT_REGION) {
  config = {
    ...config,
    region: import.meta.env.VITE_AWS_DEFAULT_REGION,
  };
}

const s3 = new S3Client(config);

export async function fetchExplorerReleases(): Promise<ListObjectsV2Output['Contents']> {
  try {
    const params = {
      Bucket: BUCKET,
      Prefix: RELEASE_PREFIX,
    };

    const data: ListObjectsV2Output = await s3.send(new ListObjectsV2Command(params));

    if (data.Contents) {
      return data.Contents.sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0));
    }
  } catch (err) {
    console.error('Error Fetching Explorer releases', err);
    throw err;
  }
}

export async function getLatestExplorerRelease(_version?: string, _isPrerelease: boolean = false) {
  const releases = await fetchExplorerReleases();
  const os = (await getOSName()).toLowerCase();
  const release = releases?.find(release => release.Key?.toLowerCase().includes(os));
  if (release && release.Key) {
    const versionMatch = release.Key.match(/v?\d+\.\d+\.\d+-?\w*/);

    return {
      browser_download_url: `${getBucketURL()}/${release.Key}`,
      version: versionMatch?.[0] ?? '0.0.0',
    };
  }
}
