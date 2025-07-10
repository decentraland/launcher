import { join, dirname } from 'path';
import fs from 'node:fs';
import { spawn } from 'child_process';
import { BrowserWindow, ipcMain } from 'electron';
import { CancelError, download } from 'electron-dl';
import log from 'electron-log/main';
import semver from 'semver';
import {
  Analytics,
  IPC_EVENTS,
  IPC_EVENT_DATA_TYPE,
  ANALYTICS_EVENT,
  IPC_HANDLERS,
  getErrorMessage,
  getBucketURL,
  RELEASE_PREFIX,
  PLATFORM,
} from '#shared';
import {
  getAppBasePath,
  decompressFile,
  getAppVersion,
  getProvider,
  isAppUpdated,
  getArch,
  getPlatform,
  getOSName,
  getDownloadsPath,
} from '../helpers';
import { getUserId } from './config';

const EXPLORER_PATH = join(getAppBasePath(), 'Explorer');
const EXPLORER_DOWNLOADS_PATH = join(EXPLORER_PATH, 'downloads');
const EXPLORER_DOWNLOADED_FILENAME = 'decentraland.zip';
const EXPLORER_VERSION_PATH = join(EXPLORER_PATH, 'version.json');
const EXPLORER_LATEST_VERSION_PATH = join(EXPLORER_PATH, 'latest');
const EXPLORER_DEV_VERSION_PATH = join(EXPLORER_PATH, 'dev');
const EXPLORER_MAC_BIN_PATH = '/Decentraland.app/Contents/MacOS/Explorer';
const EXPLORER_WIN_BIN_PATH = '/Decentraland.exe';
const LAUNCHER_BASE_URL = 'https://explorer-artifacts.decentraland.org/launcher-rust';

const analytics = new Analytics(getUserId(), getOSName(), getAppVersion());

function getVersionData(): Record<string, string> {
  return fs.existsSync(EXPLORER_VERSION_PATH) ? JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8')) : {};
}

function getExplorerBinPath(version?: string): string {
  const explorerPath = version
    ? version === 'dev'
      ? EXPLORER_DEV_VERSION_PATH
      : join(EXPLORER_PATH, version)
    : EXPLORER_LATEST_VERSION_PATH;

  if (getOSName() === PLATFORM.MAC) {
    return join(explorerPath, EXPLORER_MAC_BIN_PATH);
  } else if (getOSName() === PLATFORM.WINDOWS) {
    return join(explorerPath, EXPLORER_WIN_BIN_PATH);
  } else {
    throw new Error('Unsupported OS');
  }
}

export function isExplorerInstalled(_event: Electron.IpcMainInvokeEvent, version?: string) {
  return fs.existsSync(getExplorerBinPath(version));
}

export function isExplorerUpdated(event: Electron.IpcMainInvokeEvent, version: string) {
  return isExplorerInstalled(event, version) && isAppUpdated(EXPLORER_PATH, version);
}

export async function downloadExplorer(event: Electron.IpcMainInvokeEvent, url: string) {
  let version: string | undefined = 'unknown';

  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    log.info('[Main Window][IPC][DownloadExplorer] Downloading', url);

    const versionPattern = new RegExp(`(^${getBucketURL()}\\/\\${RELEASE_PREFIX})\\/(v?\\d+\\.\\d+\\.\\d+-?\\w*)\\/(\\w+.zip)$`);
    version = url.match(versionPattern)?.[2];

    if (!version) {
      log.error('[Main Window][IPC][DownloadExplorer] No valid url provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No version provided',
      });
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION_ERROR, { version, error: 'No version provided' });
      return;
    }

    if (url) {
      const resp = await download(win, url, {
        directory: EXPLORER_DOWNLOADS_PATH,
        filename: EXPLORER_DOWNLOADED_FILENAME,
        onStarted: _item => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.START,
            progress: 0,
          });
          analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION, { version: version as string });
        },
        onProgress: progress => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.PROGRESS,
            progress: progress.percent * 100,
          });
        },
        onCompleted: () => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.COMPLETED, version: version as string });
          analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION_SUCCESS, { version: version as string });
        },
        onCancel: () => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.CANCELLED,
          });
        },
      });
      return JSON.stringify(resp);
    } else {
      log.error('[Main Window][IPC][DownloadExplorer] No URL provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No URL provided',
      });
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION_ERROR, { version, error: 'No URL provided' });
    }
  } catch (error) {
    if (error instanceof CancelError) {
      log.error('[Main Window][IPC][DownloadExplorer] Download Cancelled');
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION_CANCELLED, { version: version as string });
    } else {
      log.error('[Main Window][IPC][DownloadExplorer] Error Downloading', url, getErrorMessage(error));
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_VERSION_ERROR, { version, error: getErrorMessage(error) });
    }
  }

  return null;
}

export async function installExplorer(event: Electron.IpcMainInvokeEvent, version: string, downloadedFilePath?: string) {
  const branchPath = join(EXPLORER_PATH, version);
  const filePath = downloadedFilePath ?? join(EXPLORER_DOWNLOADS_PATH, EXPLORER_DOWNLOADED_FILENAME);
  let versionData = getVersionData();

  try {
    event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.START });
    analytics.track(ANALYTICS_EVENT.INSTALL_VERSION_START, { version });

    if (!fs.existsSync(filePath)) {
      throw new Error(`Downloaded explorer file not found: ${filePath}.`);
    }

    await decompressFile(filePath, branchPath);

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

    versionData = {
      ...versionData,
      [version]: Date.now().toString(),
      ...(version !== 'dev' ? { version } : {}),
    };

    fs.writeFileSync(EXPLORER_VERSION_PATH, JSON.stringify(versionData));

    event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.COMPLETED });
    analytics.track(ANALYTICS_EVENT.INSTALL_VERSION_SUCCESS, { version });

    fs.rmSync(filePath);
    // Delete old versions
    cleanupVersions();
  } catch (error) {
    log.error('[Main Window][IPC][InstallExplorer] Failed to install app:', getErrorMessage(error));
    event.sender.send(IPC_EVENTS.INSTALL_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
    analytics.track(ANALYTICS_EVENT.INSTALL_VERSION_ERROR, { version });
  }
}

async function cleanupVersions() {
  const installations = fs.readdirSync(EXPLORER_PATH).filter(folder => semver.valid(folder));
  if (installations.length < 1) {
    return;
  }

  const sortedVersions = installations.sort(semver.compare);
  sortedVersions.slice(0, -2).forEach(version => {
    const folderPath = join(EXPLORER_PATH, version);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  });
}

export async function launchExplorer(event: Electron.IpcMainInvokeEvent, version?: string) {
  const versionData = JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8'));

  try {
    log.info('[Main Window][IPC][LaunchExplorer] Launching Explorer');
    event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, { type: IPC_EVENT_DATA_TYPE.LAUNCH });
    analytics.track(ANALYTICS_EVENT.LAUNCH_CLIENT_START, { version: versionData.version });

    const explorerBinPath = getExplorerBinPath(version);
    const explorerBinDir = dirname(explorerBinPath);

    if (!fs.existsSync(explorerBinPath)) {
      const errorMessage = version ? `The explorer version specified: ${version} is not installed.` : 'The explorer is not installed.';
      log.error(`[Main Window][IPC][LaunchExplorer] ${errorMessage}`, explorerBinPath);
      throw new Error(errorMessage);
    }

    // Validates the explorer binary is executable
    fs.accessSync(explorerBinPath, fs.constants.X_OK);

    // Forward the deeplink url to the explorer containing all the params
    const explorerParams = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).protocol,
      '--launcher_anonymous_id',
      analytics.getAnonymousId(),
      '--session_id',
      analytics.getSessionId(),
      '--provider',
      getProvider(),
    ].filter(arg => !!arg);

    log.info('[Main Window][IPC][LaunchExplorer] Opening the Explorer', explorerBinPath, explorerParams);

    let hasStarted = false;
    const maxWaitTime = 10000; // 10 seconds timeout

    const explorerProcess = spawn(explorerBinPath, explorerParams, {
      cwd: explorerBinDir,
      detached: true,
      stdio: 'pipe',
    });

    await new Promise((resolve, reject) => {
      // Set up timeout to check if process started
      const timeout = setTimeout(() => {
        if (!hasStarted) {
          const timeoutError = new Error('Process failed to start within timeout');
          log.error('[Main Window][IPC][LaunchExplorer] ' + timeoutError.message);
          explorerProcess.kill();
          reject(timeoutError);
        }
      }, maxWaitTime);

      // Capture stdout for debugging
      explorerProcess.stdout?.on('data', data => {
        const output = data.toString();
        log.info('[Main Window][IPC][LaunchExplorer] Process stdout:', output);
      });

      // Capture stderr for debugging
      explorerProcess.stderr?.on('data', data => {
        log.error('[Main Window][IPC][LaunchExplorer] Process stderr:', data.toString());
      });

      explorerProcess
        .on('spawn', () => {
          log.info('[Main Window][IPC][LaunchExplorer] Process spawned successfully');
          hasStarted = true;

          // Wait a bit and check if process is still running
          setTimeout(() => {
            // Try to send a signal 0 to check if process is running
            try {
              process.kill(explorerProcess.pid!, 0);
              clearTimeout(timeout);
              resolve(true);
            } catch (err) {
              reject(new Error('Process died shortly after starting'));
            }
          }, 2000); // Wait 2 seconds to check if the process is still running
        })
        .on('close', (code, signal) => {
          clearTimeout(timeout);
          if (!hasStarted) {
            const closeError = new Error(`Process closed before starting. Code: ${code}, Signal: ${signal}`);
            log.error('[Main Window][IPC][LaunchExplorer] ' + closeError.message);
            reject(closeError);
          }
        })
        .on('error', error => {
          clearTimeout(timeout);
          log.error('[Main Window][IPC][LaunchExplorer] Failed to open app:', error);
          reject(error);
        });
    });

    // If we get here, Unity is fully initialized
    log.info('[Main Window][IPC][LaunchExplorer] Explorer launched successfully');
    event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, { type: IPC_EVENT_DATA_TYPE.LAUNCHED });
    await analytics.track(ANALYTICS_EVENT.LAUNCH_CLIENT_SUCCESS, { version: versionData.version });
    await closeWindow();
  } catch (error) {
    log.error('[Main Window][IPC][LaunchExplorer] Failed to launch Explorer:', getErrorMessage(error));
    event.sender.send(IPC_EVENTS.LAUNCH_EXPLORER, {
      type: IPC_EVENT_DATA_TYPE.ERROR,
      error: getErrorMessage(error),
    });
    analytics.track(ANALYTICS_EVENT.LAUNCH_CLIENT_ERROR, {
      version: versionData.version,
    });
  }
}

export async function downloadLauncher(event: Electron.IpcMainInvokeEvent) {
  const osName = getOSName();
  let url = '';

  if (osName === PLATFORM.MAC) {
    url = `${LAUNCHER_BASE_URL}/Decentraland_aarch64.dmg`;
  } else if (osName === PLATFORM.WINDOWS) {
    url = `${LAUNCHER_BASE_URL}/Decentraland_x64-setup.exe`;
  } else {
    log.error('[Main Window][IPC][DownloadLauncher] Unsupported OS');
    return;
  }

  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    log.info('[Main Window][IPC][DownloadLauncher] Downloading', url);

    if (url) {
      const resp = await download(win, url, {
        directory: getDownloadsPath(),
        onStarted: _item => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.START,
            progress: 0,
          });
          analytics.track(ANALYTICS_EVENT.DOWNLOAD_LAUNCHER);
        },
        onProgress: progress => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.PROGRESS,
            progress: progress.percent * 100,
          });
        },
        onCompleted: () => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.COMPLETED });
          analytics.track(ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_SUCCESS);
        },
        onCancel: () => {
          event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
            type: IPC_EVENT_DATA_TYPE.CANCELLED,
          });
        },
      });
      return JSON.stringify(resp);
    } else {
      log.error('[Main Window][IPC][DownloadLauncher] No URL provided');
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, {
        type: IPC_EVENT_DATA_TYPE.ERROR,
        error: 'No URL provided',
      });
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_ERROR, { error: 'No URL provided' });
    }
  } catch (error) {
    if (error instanceof CancelError) {
      log.error('[Main Window][IPC][DownloadLauncher] Download Cancelled');
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_CANCELLED);
    } else {
      log.error('[Main Window][IPC][DownloadLauncher] Error Downloading', url, getErrorMessage(error));
      event.sender.send(IPC_EVENTS.DOWNLOAD_STATE, { type: IPC_EVENT_DATA_TYPE.ERROR, error });
      await analytics.track(ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_ERROR, { error: getErrorMessage(error) });
    }
  }

  return null;
}

export function initIpcHandlers() {
  ipcMain.handle(IPC_HANDLERS.DOWNLOAD_EXPLORER, downloadExplorer);
  ipcMain.handle(IPC_HANDLERS.INSTALL_EXPLORER, installExplorer);
  ipcMain.handle(IPC_HANDLERS.LAUNCH_EXPLORER, launchExplorer);
  ipcMain.handle(IPC_HANDLERS.IS_EXPLORER_INSTALLED, isExplorerInstalled);
  ipcMain.handle(IPC_HANDLERS.IS_EXPLORER_UPDATED, isExplorerUpdated);
  ipcMain.handle(IPC_HANDLERS.DOWNLOAD_LAUNCHER, downloadLauncher);
  ipcMain.handle(IPC_HANDLERS.GET_PLATFORM, getPlatform);
  ipcMain.handle(IPC_HANDLERS.GET_OS_NAME, getOSName);
  ipcMain.handle(IPC_HANDLERS.GET_ARCH, getArch);
}

async function closeWindow() {
  BrowserWindow.getAllWindows()
    .filter(w => !w.isDestroyed())
    .forEach(window => {
      window.hide(); // Hide first to prevent flash
      window.close();
    });
}
