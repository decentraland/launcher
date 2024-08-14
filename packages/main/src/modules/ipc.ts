import { join } from 'path';
import fs from 'node:fs';
import { spawn } from 'child_process';
import { app, BrowserWindow, ipcMain } from 'electron';
import { download } from 'electron-dl';
import log from 'electron-log/main';
import { Analytics, IPC_EVENTS, IPC_EVENT_DATA_TYPE, ANALYTICS_EVENT, IPC_HANDLERS, getErrorMessage } from '#shared';
import { getAppBasePath, decompressFile, getOSName, isAppInstalled, isAppUpdated, PLATFORM } from '../helpers';
import { getUserId } from './config';

const EXPLORER_PATH = join(getAppBasePath(), 'Explorer');
const EXPLORER_DOWNLOADS_PATH = join(EXPLORER_PATH, 'downloads');
const EXPLORER_VERSION_PATH = join(EXPLORER_PATH, 'version.json');
const EXPLORER_LATEST_VERSION_PATH = join(EXPLORER_PATH, 'latest');
const EXPLORER_MAC_BIN_PATH = '/Decentraland.app/Contents/MacOS/Explorer';
const EXPLORER_WIN_BIN_PATH = '/Decentraland.exe';

const analytics = new Analytics(getUserId());

export async function downloadExplorer(event: Electron.IpcMainInvokeEvent, url: string) {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    log.info('[Main Window][IPC][DownloadExplorer] Downloading', url);

    const versionPattern = /^https:\/\/github.com\/decentraland\/.+\/releases\/download\/(v?\d+\.\d+\.\d+-?\w+)\/(\w+.zip)$/;
    const version = url.match(versionPattern)?.[1];

    if (!version) {
      log.error('[Main Window][IPC][DownloadExplorer] No valid url provided');
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
        log.info('[Main Window][IPC][DownloadExplorer] This version is already installed');
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
          analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION, { version, os: getOSName() });
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
            analytics.track(ANALYTICS_EVENT.INSTALL_VERSION_START, { version, os: getOSName() });

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
            analytics.track(ANALYTICS_EVENT.INSTALL_VERSION_SUCCESS, { version, os: getOSName() });
          } catch (error) {
            log.error('[Main Window][IPC][DownloadExplorer] Failed to install app:', error);
            event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
            analytics.track(ANALYTICS_EVENT.INSTALL_VERSION_ERROR, { version, os: getOSName() });
          } finally {
            if (fs.existsSync(file.path)) {
              fs.rmSync(file.path);
            }
          }
        },
        onCancel: () => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.CANCELLED,
          });
          log.error('[Main Window][IPC][DownloadExplorer] Download Cancelled');
        },
      });
      return JSON.stringify(resp);
    } else {
      log.error('[Main Window][IPC][DownloadExplorer] No URL provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No URL provided',
      });
    }
  } catch (error) {
    log.error('[Main Window][IPC][DownloadExplorer] Error Downloading', url, error);
    event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
  }

  return null;
}

export function isExplorerInstalled(_event: Electron.IpcMainInvokeEvent) {
  return isAppInstalled(EXPLORER_PATH) && fs.existsSync(EXPLORER_LATEST_VERSION_PATH);
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

export async function launchExplorer(event: Electron.IpcMainInvokeEvent, _app: string, version?: string) {
  try {
    log.info('[Main Window][IPC][LaunchExplorer] Launching Explorer');
    event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, { type: IPC_EVENT_DATA_TYPE.LAUNCH });

    const explorerBinPath = getExplorerBinPath(version);

    if (!fs.existsSync(explorerBinPath)) {
      const errorMessage = version ? `The explorer version specified: ${version} is not installed.` : 'The explorer is not installed.';
      log.error(`[Main Window][IPC][LaunchExplorer] ${errorMessage}`);
      event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: errorMessage,
      });
      return;
    }

    // Validates the explorer binary is executable
    fs.accessSync(explorerBinPath, fs.constants.X_OK);

    // Forward the deeplink url to the explorer containing all the params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const explorerArgs = [(global as any).protocol].filter(arg => !!arg);
    log.info('[Main Window][IPC][LaunchExplorer] Opening the Explorer', explorerArgs);
    spawn(explorerBinPath, explorerArgs, { detached: true, stdio: 'ignore' })
      .on('spawn', () => {
        event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, { type: IPC_EVENT_DATA_TYPE.LAUNCHED });
        BrowserWindow.getAllWindows()
          .find(w => !w.isDestroyed())
          ?.close();
      })
      .on('close', () => {
        app.quit();
      })
      .on('error', error => {
        log.error('[Main Window][IPC][LaunchExplorer] Failed to open app:', error);
        event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, { type: IPC_EVENT_DATA_TYPE.ERROR, error: error.message });
      });
  } catch (error) {
    log.error('[Main Window][IPC][LaunchExplorer] Failed to open app:', error);
    event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, {
      type: IPC_EVENT_DATA_TYPE.ERROR,
      error: getErrorMessage(error),
    });
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

export function initIpcHandlers() {
  ipcMain.handle(IPC_HANDLERS.DOWNLOAD_EXPLORER, downloadExplorer);
  ipcMain.handle(IPC_HANDLERS.LAUNCH_EXPLORER, launchExplorer);
  ipcMain.handle(IPC_HANDLERS.IS_EXPLORER_INSTALLED, isExplorerInstalled);
  ipcMain.handle(IPC_HANDLERS.IS_EXPLORER_UPDATED, isExplorerUpdated);
  ipcMain.handle(IPC_HANDLERS.MINIMIZE_WINDOW, minimizeWindow);
  ipcMain.handle(IPC_HANDLERS.GET_OS_NAME, getOSName);
}
