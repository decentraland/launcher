import { getBucketURL, RELEASE_PREFIX } from '#shared';
import { getOSName } from './ipc';

export async function fetchExplorerLatestRelease() {
  try {
    const response = await fetch(`${getBucketURL()}/${RELEASE_PREFIX}/latest.json?_t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Error Fetching Explorer releases', err);
    throw err;
  }
}

export async function getLatestExplorerRelease(_version?: string, _isPrerelease: boolean = false) {
  try {
    const latestRelease = await fetchExplorerLatestRelease();
    const os = (await getOSName()).toLowerCase();
    const releaseName = `Decentraland_${os}.zip`;
    const releaseUrl = `${getBucketURL()}/${RELEASE_PREFIX}/${latestRelease.version}/${releaseName}`;

    return {
      browser_download_url: releaseUrl,
      version: latestRelease.version,
    };
  } catch (err) {
    console.error('Error getting latest Explorer release', err);
    throw err;
  }
}
