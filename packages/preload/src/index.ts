/**
 * @module preload
 */
import {
  downloadExplorer,
  downloadState,
  installExplorer,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
} from './ipc';
import { getVersion, getIsPrerelease, getRunDevVersion, getDownloadedFilePath } from './argvs';
export {
  downloadExplorer,
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
};
