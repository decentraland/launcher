/**
 * @module preload
 */
import {
  downloadApp,
  downloadState,
  installState,
  openApp,
  openAppState,
  minimize,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
} from './ipc';
import { getVersion, getIsPrerelease } from './argvs';
export {
  downloadApp,
  downloadState,
  installState,
  openApp,
  openAppState,
  minimize,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
  getVersion,
  getIsPrerelease,
};
