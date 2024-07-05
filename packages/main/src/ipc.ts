import {join} from 'path';
import fs from 'node:fs';
import {spawn} from 'child_process';
import {BrowserWindow} from 'electron';
import {CancelError, download} from 'electron-dl';
import {getAppBasePath, decompressFile, getOSName, isAppInstalled, isAppUpdated} from './helpers';

export const EXPLORER_PATH = join(getAppBasePath(), 'Explorer');
export const EXPLORER_VERSION_PATH = join(EXPLORER_PATH, 'version.json');

export async function downloadApp(event: Electron.IpcMainInvokeEvent, url: string) {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    console.log('[Main Window] Downloading', url);
    const downloadPath = join(EXPLORER_PATH, 'downloads');
    const versionPattern =
      /https:\/\/github.com\/decentraland\/.+\/releases\/download\/(v?\d+\.\d+\.\d+-?\w+)\/(\w+.zip)/;
    const version = url.match(versionPattern)?.[1] ?? 'dev';
    const branchPath = join(EXPLORER_PATH, version);
    if (url) {
      // const versionFile = fs.openSync(EXPLORER_VERSION_PATH, 'a');
      const versionData = fs.existsSync(EXPLORER_VERSION_PATH)
        ? JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8'))
        : null;
      // fs.closeSync(versionFile);
      if (versionData && versionData.version === version) {
        console.log('[Main Window] This version is already installed');
        event.sender.send('downloadState', {type: 'CANCELLED'});
        return;
      }
      const resp = await download(win, url, {
        directory: downloadPath,
        onStarted: item => {
          console.log('onStarted:', item);
          event.sender.send('downloadState', {type: 'PROGRESS', progress: 0});
        },
        onProgress: progress => {
          console.log('onProgress:', progress);
          event.sender.send('downloadState', {type: 'PROGRESS', progress: progress.percent * 100});
        },
        onCompleted: async file => {
          console.log('onCompleted:', file);
          await decompressFile(file.path, branchPath);
          if (fs.existsSync(file.path)) {
            fs.rmSync(file.path);
          }

          if (getOSName() === 'mac') {
            const execPath = `${branchPath}/Decentraland.app/Contents/MacOS/Explorer`;
            console.log('execPath ' + execPath);
            if (fs.existsSync(execPath)) {
              fs.chmodSync(execPath, 0o755);
            }
          } else if (getOSName() === 'win32') {
            // TODO: Implement windows installation
            // const execPath = `${branchPath}/Decentraland`;
            // console.log('execPath ' + execPath);
            // if (fs.existsSync(execPath)) {
            //   fs.chmodSync(execPath, 0o755);
            // }
          }

          const versionData = {
            version: version,
          };

          fs.writeFileSync(EXPLORER_VERSION_PATH, JSON.stringify(versionData));

          event.sender.send('downloadState', {type: 'READY'});
        },
      });
      return JSON.stringify(resp);
    } else {
      console.error('[Main Window] No URL provided');
    }
  } catch (error) {
    if (error instanceof CancelError) {
      console.info('[Main Window] item.cancel() was called');
    } else {
      console.error('[Main Window] Error Downloading', url, error);
    }
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
    const versionData = fs.existsSync(EXPLORER_VERSION_PATH)
      ? JSON.parse(fs.readFileSync(EXPLORER_VERSION_PATH, 'utf8'))
      : null;

    if (!!versionData && !!versionData.version) {
      const execPath = join(
        EXPLORER_PATH,
        versionData.version,
        '/Decentraland.app/Contents/MacOS/Explorer',
      );
      if (fs.existsSync(execPath)) {
        spawn(execPath);
        event.sender.send('openApp', {type: 'OPENED'});
      }
    } else {
      event.sender.send('openApp', {type: 'CANCELLED', message: 'Failed to open app'});
    }
  } catch (error) {
    console.error('Failed to open app:', error);
    event.sender.send('openApp', {type: 'CANCELLED', error});
  }
}
