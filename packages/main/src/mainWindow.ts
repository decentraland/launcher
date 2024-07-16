import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain } from 'electron';
import { IPC_HANDLERS } from '#shared';
import { downloadApp, openApp, minimizeWindow, isExplorerInstalled, isExplorerUpdated } from './ipc';
import { getOSName } from './helpers';

async function createWindow() {
  const browserWindow = new BrowserWindow({
    show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
    width: 1006, // 990+16 border
    height: 849, // 790+59 border
    minWidth: 1006,
    minHeight: 849,
    maxWidth: 1006,
    maxHeight: 849,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(app.getAppPath(), 'packages/preload/dist/index.mjs'),
    },
  });

  /**
   * If the 'show' property of the BrowserWindow's constructor is omitted from the initialization options,
   * it then defaults to 'true'. This can cause flickering as the window loads the html content,
   * and it also has show problematic behaviour with the closing of the window.
   * Use `show: false` and listen to the  `ready-to-show` event to show the window.
   *
   * @see https://github.com/electron/electron/issues/25012 for the afford mentioned issue.
   */
  browserWindow.on('ready-to-show', () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
  });

  /**
   * Load the main page of the main window.
   */
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined) {
    /**
     * Load from the Vite dev server for development.
     */
    await browserWindow.loadURL(import.meta.env.VITE_DEV_SERVER_URL);
  } else {
    /**
     * Load from the local file system for production and test.
     *
     * Use BrowserWindow.loadFile() instead of BrowserWindow.loadURL() for WhatWG URL API limitations
     * when path contains special characters like `#`.
     * Let electron handle the path quirks.
     * @see https://github.com/nodejs/node/issues/12682
     * @see https://github.com/electron/electron/issues/6869
     */
    await browserWindow.loadFile(fileURLToPath(new URL('./../../renderer/dist/index.html', import.meta.url)));
  }

  ipcMain.handle(IPC_HANDLERS.DOWNLOAD_APP, downloadApp);
  ipcMain.handle(IPC_HANDLERS.OPEN_APP, openApp);
  ipcMain.handle(IPC_HANDLERS.IS_EXPLORER_INSTALLED, isExplorerInstalled);
  ipcMain.handle(IPC_HANDLERS.IS_EXPLORER_UPDATED, isExplorerUpdated);
  ipcMain.handle(IPC_HANDLERS.MINIMIZE_WINDOW, minimizeWindow);
  ipcMain.handle(IPC_HANDLERS.GET_OS_NAME, getOSName);

  return browserWindow;
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
}
