/**
 * @module preload
 */
import {
  downloadExplorer,
  downloadLauncher,
  downloadState,
  installExplorer,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
} from './ipc';
import { getVersion, getIsPrerelease, getRunDevVersion, getDownloadedFilePath } from './argvs';
import { getLatestExplorerRelease } from './s3';
import { getPlatform, getArch, getOSName } from './platform';
export {
  downloadExplorer,
  downloadLauncher,
  downloadState,
  installExplorer,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
  getVersion,
  getIsPrerelease,
  getRunDevVersion,
  getDownloadedFilePath,
  getLatestExplorerRelease,
  getPlatform,
  getArch,
};
