/**
 * @module preload
 */
import {
  downloadApp,
  downloadState,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
} from './ipc';
import { getVersion, getIsPrerelease } from './argvs';
export {
  downloadApp,
  downloadState,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
  getVersion,
  getIsPrerelease,
};
