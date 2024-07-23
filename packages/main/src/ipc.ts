import { join } from 'path';
import fs from 'node:fs';
import { spawn } from 'child_process';
import { app, BrowserWindow } from 'electron';
import { download } from 'electron-dl';
import log from 'electron-log/main';
import { IPC_EVENTS, IPC_EVENT_DATA_TYPE } from '#shared';
import { getAppBasePath, decompressFile, getOSName, isAppInstalled, isAppUpdated, PLATFORM } from './helpers';

log.initialize();

export const EXPLORER_PATH = join(getAppBasePath(), 'Explorer');
export const EXPLORER_DOWNLOADS_PATH = join(EXPLORER_PATH, 'downloads');
export const EXPLORER_VERSION_PATH = join(EXPLORER_PATH, 'version.json');
export const EXPLORER_LATEST_VERSION_PATH = join(EXPLORER_PATH, 'latest');
export const EXPLORER_MAC_BIN_PATH = '/Decentraland.app/Contents/MacOS/Explorer';
export const EXPLORER_WIN_BIN_PATH = '/Decentraland.exe';
export const EXPLORER_REGEDIT_PATH = 'regedit.bat';

export async function downloadApp(event: Electron.IpcMainInvokeEvent, url: string) {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    log.debug('[Main Window][IPC][DownloadApp] Downloading', url);
    const versionPattern = /https:\/\/github.com\/decentraland\/.+\/releases\/download\/(v?\d+\.\d+\.\d+-?\w+)\/(\w+.zip)/;
    const version = url.match(versionPattern)?.[1];

    if (!version) {
      log.error('[Main Window][IPC][DownloadApp] No version provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No version provided',
      });
      return;
    }

    const branchPath = join(EXPLORER_PATH, version);

    if (url) {
      const versionData = fs.existsSync(EXPLORER_VERSION_PATH) ? JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8')) : null;

      if (versionData && versionData.version === version) {
        log.debug('[Main Window][IPC][DownloadApp] This version is already installed');
        event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.CANCELLED });
        return;
      }

      const resp = await download(win, url, {
        directory: EXPLORER_DOWNLOADS_PATH,
        onStarted: _item => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.START,
            progress: 0,
          });
        },
        onProgress: progress => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.PROGRESS,
            progress: progress.percent * 100,
          });
        },
        onCompleted: async file => {
          try {
            event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.COMPLETED });
            event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.START });

            await decompressFile(file.path, branchPath);

            if (getOSName() === PLATFORM.MAC) {
              const explorerBinPath = join(branchPath, EXPLORER_MAC_BIN_PATH);
              if (fs.existsSync(explorerBinPath)) {
                fs.chmodSync(explorerBinPath, 0o755);
              }
            }

            if (fs.existsSync(EXPLORER_LATEST_VERSION_PATH)) {
              fs.unlinkSync(EXPLORER_LATEST_VERSION_PATH);
            }

            fs.symlinkSync(branchPath, EXPLORER_LATEST_VERSION_PATH, 'junction');

            const versionData = {
              version: version,
            };

            fs.writeFileSync(EXPLORER_VERSION_PATH, JSON.stringify(versionData));

            event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.COMPLETED });
          } catch (error) {
            log.error('[Main Window][IPC][DownloadApp] Failed to install app:', error);
            event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
          } finally {
            if (fs.existsSync(file.path)) {
              fs.rmSync(file.path);
            }
          }
        },
      });
      return JSON.stringify(resp);
    } else {
      log.error('[Main Window][IPC][DownloadApp] No URL provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No URL provided',
      });
    }
  } catch (error) {
    log.error('[Main Window][IPC][DownloadApp] Error Downloading', url, error);
    event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
  }

  return null;
}

export function isExplorerInstalled(_event: Electron.IpcMainInvokeEvent) {
  return isAppInstalled(EXPLORER_PATH) && isAppInstalled(EXPLORER_LATEST_VERSION_PATH);
}

export function isExplorerUpdated(_event: Electron.IpcMainInvokeEvent, version: string) {
  return isAppUpdated(EXPLORER_PATH, version);
}

function getExplorerBinPath(version?: string): string {
  const explorerPath = version ? join(EXPLORER_PATH, version) : EXPLORER_LATEST_VERSION_PATH;

  if (getOSName() === PLATFORM.MAC) {
    return join(explorerPath, EXPLORER_MAC_BIN_PATH);
  } else if (getOSName() === PLATFORM.WINDOWS) {
    return join(explorerPath, EXPLORER_WIN_BIN_PATH);
  } else {
    throw new Error('Unsupported OS');
  }
}

export function openApp(event: Electron.IpcMainInvokeEvent, _app: string, version?: string) {
  try {
    log.debug('[Main Window][IPC][OpenApp] Opening App');

    const explorerBinPath = getExplorerBinPath(version);

    if (!fs.existsSync(explorerBinPath)) {
      if (version) {
        log.error('[Main Window][IPC][OpenApp] The explorer version specified is not installed');
        event.sender.send(IPC_EVENTS.OPEN_APP, {
          type: IPC_EVENT_DATA_TYPE.ERROR,
          error: `The explorer version ${version} is not installed.`,
        });
      } else {
        log.error('[Main Window][IPC][OpenApp] The explorer is not installed');
        event.sender.send(IPC_EVENTS.OPEN_APP, {
          type: IPC_EVENT_DATA_TYPE.ERROR,
          error: 'The explorer is not installed.',
        });
      }
      return;
    }

    // Validates the explorer binary is executable
    fs.accessSync(explorerBinPath, fs.constants.X_OK);

    spawn(explorerBinPath)
      .on('spawn', () => {
        event.sender.send(IPC_EVENTS.OPEN_APP, { type: IPC_EVENT_DATA_TYPE.OPEN });
      })
      .on('close', () => {
        app.quit();
      })
      .on('error', error => {
        log.error('[Main Window][IPC][OpenApp] Failed to open app:', error);
        event.sender.send(IPC_EVENTS.OPEN_APP, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
      });
  } catch (error) {
    log.error('[Main Window][IPC][OpenApp] Failed to open app:', error);
    event.sender.send(IPC_EVENTS.OPEN_APP, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
  }
}

export function minimizeWindow(_event: Electron.IpcMainInvokeEvent) {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    win.minimize();
  } catch (error) {
    log.error('[Main Window][IPC][MinimizeWindow] Failed to minimize window:', error);
  }
}
