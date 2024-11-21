import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import type { ListObjectsV2Output, GetObjectCommandOutput, S3ClientConfig } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
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

export async function fetchExplorerReleases(version?: string): Promise<ListObjectsV2Output['Contents']> {
  try {
    const params = {
      Bucket: BUCKET,
      Prefix: version ? `${RELEASE_PREFIX}/${version}` : RELEASE_PREFIX,
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

export async function fetchExplorerLatestRelease() {
  try {
    const params = {
      Bucket: BUCKET,
      Key: `${RELEASE_PREFIX}/latest.json`,
    };

    const response: GetObjectCommandOutput = await s3.send(new GetObjectCommand(params));

    if (response.Body instanceof Readable) {
      const jsonString = await streamToString(response.Body);
      return JSON.parse(jsonString);
    }
  } catch (err) {
    console.error('Error Fetching Explorer releases', err);
    throw err;
  }
}

export async function getLatestExplorerRelease(_version?: string, _isPrerelease: boolean = false) {
  const latestRelease = await fetchExplorerLatestRelease();
  const releases = await fetchExplorerReleases(latestRelease['version']);
  const os = (await getOSName()).toLowerCase();
  // TODO: Get different releases based on a flag for provider
  const releaseName = `_${os}.zip`.toLowerCase();
  const release = releases?.find(release => release.Key?.toLowerCase().endsWith(releaseName));
  if (release && release.Key) {
    const versionMatch = release.Key.match(/v?\d+\.\d+\.\d+-?\w*/);

    return {
      browser_download_url: `${getBucketURL()}/${release.Key}`,
      version: versionMatch?.[0] ?? '0.0.0',
    };
  }
}

/**
 * Converts a Readable stream to a string.
 * @param stream The Readable stream to convert.
 * @returns A promise resolving to the string content of the stream.
 */
async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []; // Ensure the array is of type Uint8Array
    stream.on('data', chunk => chunks.push(chunk as Uint8Array)); // Cast each chunk
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8'))); // Use Buffer.concat
    stream.on('error', reject);
  });
}
