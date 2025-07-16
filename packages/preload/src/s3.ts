import log from 'electron-log/renderer';
import { getBucketURL, getErrorMessage, RELEASE_PREFIX } from '#shared';
import { getOSName } from './platform';

export async function fetchExplorerLatestRelease() {
  try {
    const url = `${getBucketURL()}/${RELEASE_PREFIX}/latest.json?_t=${Date.now()}`;
    log.info('[Preload][S3][fetchExplorerLatestRelease] Fetching latest release from:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    log.info('[Preload][S3][fetchExplorerLatestRelease] Latest release fetched successfully:', data);
    return data;
  } catch (err) {
    log.error('[Preload][S3][fetchExplorerLatestRelease] Failed to fetch Explorer releases:', {
      error: getErrorMessage(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

export async function getLatestExplorerRelease(_version?: string, _isPrerelease: boolean = false) {
  try {
    const latestRelease = await fetchExplorerLatestRelease();
    const os = (await getOSName()).toLowerCase();
    const releaseName = `Decentraland_${os}.zip`;
    const releaseUrl = `${getBucketURL()}/${RELEASE_PREFIX}/${latestRelease.version}/${releaseName}`;

    log.info('[Preload][S3][getLatestExplorerRelease] Release URL generated:', {
      os,
      version: latestRelease.version,
      url: releaseUrl,
    });

    return {
      browser_download_url: releaseUrl,
      version: latestRelease.version,
    };
  } catch (err) {
    log.error('[Preload][S3][getLatestExplorerRelease] Failed to get latest Explorer release:', {
      error: getErrorMessage(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}
