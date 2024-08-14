/**
 * @module preload
 */
import {
  downloadExplorer,
  downloadState,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
} from './ipc';
import { getVersion, getIsPrerelease, getRunDevVersion } from './argvs';
export {
  downloadExplorer,
  downloadState,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
  getVersion,
  getIsPrerelease,
  getRunDevVersion,
};
