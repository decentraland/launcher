import {join} from 'path';
import fs from 'node:fs';
import {spawn} from 'child_process';
import {app, BrowserWindow} from 'electron';
import {CancelError, download} from 'electron-dl';
import log from 'electron-log';
import {IPC_EVENTS, IPC_EVENT_DATA_TYPE} from '#shared';
import {
  getAppBasePath,
  decompressFile,
  getOSName,
  isAppInstalled,
  isAppUpdated,
  PLATFORM,
} from './helpers';

log.initialize();

export const EXPLORER_PATH = join(getAppBasePath(), 'Explorer');
export const EXPLORER_DOWNLOADS_PATH = join(EXPLORER_PATH, 'downloads');
export const EXPLORER_VERSION_PATH = join(EXPLORER_PATH, 'version.json');
export const EXPLORER_MAC_BIN_PATH = '/Decentraland.app/Contents/MacOS/Explorer';
export const EXPLORER_WIN_BIN_PATH = '/Decentraland.exe';
export const EXPLORER_REGEDIT_PATH = 'regedit.bat';

export async function downloadApp(event: Electron.IpcMainInvokeEvent, url: string) {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    log.debug('[Main Window] Downloading', url);
    const versionPattern =
      /https:\/\/github.com\/decentraland\/.+\/releases\/download\/(v?\d+\.\d+\.\d+-?\w+)\/(\w+.zip)/;
    const version = url.match(versionPattern)?.[1];

    if (!version) {
      log.error('[Main Window] No version provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No version provided',
      });
      return;
    }

    const branchPath = join(EXPLORER_PATH, version);

    if (url) {
      const versionData = fs.existsSync(EXPLORER_VERSION_PATH)
        ? JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8'))
        : null;

      if (versionData && versionData.version === version) {
        log.debug('[Main Window] This version is already installed');
        event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {type: IPC_EVENT_DATA_TYPE.CANCELLED});
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
            event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {type: IPC_EVENT_DATA_TYPE.COMPLETED});
            event.sender.send(IPC_EVENTS.INSTALL_STATE, {type: IPC_EVENT_DATA_TYPE.START});

            await decompressFile(file.path, branchPath);

            if (fs.existsSync(file.path)) {
              fs.rmSync(file.path);
            }

            if (getOSName() === PLATFORM.MAC) {
              const explorerBinPath = join(branchPath, EXPLORER_MAC_BIN_PATH);
              if (fs.existsSync(explorerBinPath)) {
                fs.chmodSync(explorerBinPath, 0o755);
              }
            } else if (getOSName() === PLATFORM.WINDOWS) {
              // TODO: Implement permissions for Windows
              // const explorerBinPath = join(branchPath, EXPLORER_WIN_BIN_PATH);
              // if (fs.existsSync(explorerBinPath)) {
              //   spawn('cmd.exe', [
              //     '/c',
              //     join(EXPLORER_PATH, EXPLORER_REGEDIT_PATH),
              //     explorerBinPath,
              //   ]).on('error', error => {
              //     log.error(error);
              //   });
              // }
            }

            const versionData = {
              version: version,
            };

            fs.writeFileSync(EXPLORER_VERSION_PATH, JSON.stringify(versionData));

            event.sender.send(IPC_EVENTS.INSTALL_STATE, {type: IPC_EVENT_DATA_TYPE.COMPLETED});
          } catch (error) {
            log.error('Failed to install app:', error);
            event.sender.send(IPC_EVENTS.INSTALL_STATE, {type: IPC_EVENT_DATA_TYPE.ERROR, error});
          }
        },
      });
      return JSON.stringify(resp);
    } else {
      log.error('[Main Window] No URL provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No URL provided',
      });
    }
  } catch (error) {
    if (error instanceof CancelError) {
      log.info('[Main Window] item.cancel() was called');
    } else {
      log.error('[Main Window] Error Downloading', url, error);
    }
    event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {type: IPC_EVENT_DATA_TYPE.ERROR, error});
  }

  return null;
}

export function isExplorerInstalled(_event: Electron.IpcMainInvokeEvent) {
  return isAppInstalled(EXPLORER_PATH);
}

export function isExplorerUpdated(_event: Electron.IpcMainInvokeEvent, version: string) {
  return isAppUpdated(EXPLORER_PATH, version);
}

export function openApp(event: Electron.IpcMainInvokeEvent, _app: string) {
  try {
    log.debug('[Main Window] Opening App');

    const versionData = fs.existsSync(EXPLORER_VERSION_PATH)
      ? JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8'))
      : null;

    if (!!versionData && !!versionData.version) {
      let explorerBinPath = '';
      if (getOSName() === PLATFORM.MAC) {
        log.debug('[Main Window] Mac OS Version');
        explorerBinPath = join(EXPLORER_PATH, versionData.version, EXPLORER_MAC_BIN_PATH);
      } else if (getOSName() === PLATFORM.WINDOWS) {
        log.debug('[Main Window] Windows OS Version');
        explorerBinPath = join(EXPLORER_PATH, versionData.version, EXPLORER_WIN_BIN_PATH);
      }

      if (fs.existsSync(explorerBinPath)) {
        spawn(explorerBinPath)
          .on('spawn', () => {
            event.sender.send(IPC_EVENTS.OPEN_APP, {type: IPC_EVENT_DATA_TYPE.OPEN});
          })
          .on('close', () => {
            app.quit();
          })
          .on('error', error => {
            log.error('[Main window] Failed to open app:', error);
            event.sender.send(IPC_EVENTS.OPEN_APP, {type: IPC_EVENT_DATA_TYPE.ERROR, error});
          });
      }
    } else {
      event.sender.send(IPC_EVENTS.OPEN_APP, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'The explorer is not installed.',
      });
    }
  } catch (error) {
    log.error('[Main Window] Failed to open app:', error);
    event.sender.send(IPC_EVENTS.OPEN_APP, {type: IPC_EVENT_DATA_TYPE.ERROR, error});
  }
}

export function minimizeWindow(_event: Electron.IpcMainInvokeEvent) {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    win.minimize();
  } catch (error) {
    log.error('[Main Window] Failed to minimize window:', error);
  }
}
