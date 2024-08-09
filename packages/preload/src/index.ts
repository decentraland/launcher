/**
 * @module preload
 */

import { sha256sum } from './nodeCrypto';
import { versions, platform } from './versions';
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
  sha256sum,
  versions,
  platform,
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
