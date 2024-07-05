import {ipcRenderer} from 'electron';

export enum IPC_HANDLERS {
  DOWNLOAD_APP = 'download-app',
  IS_EXPLORER_INSTALLED = 'is-explorer-installed',
  IS_EXPLORER_UPDATED = 'is-explorer-updated',
  OPEN_APP = 'open-app',
}

export async function downloadApp(url: string) {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.DOWNLOAD_APP, url);
  return JSON.parse(resp);
}

export async function isExplorerInstalled() {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.IS_EXPLORER_INSTALLED);
  return JSON.parse(resp);
}

export async function isExplorerUpdated() {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.IS_EXPLORER_UPDATED);
  return JSON.parse(resp);
}

export async function openApp(app: string) {
  ipcRenderer.invoke(IPC_HANDLERS.OPEN_APP, app);
  ipcRenderer.on('openApp', (_event, resp) => {
    if (resp) {
      return JSON.parse(resp);
    }
  });
}
