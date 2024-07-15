import {ipcRenderer, type IpcRendererEvent} from 'electron';
import {IPC_EVENTS, IPC_HANDLERS, type IpcRendererEventData} from '#shared';

export function downloadApp(url: string) {
  ipcRenderer.invoke(IPC_HANDLERS.DOWNLOAD_APP, url);
}

export function downloadState(cb: (event: IpcRendererEvent, state: IpcRendererEventData) => void) {
  return ipcRenderer.on(IPC_EVENTS.DOWNLOAD_STATE, cb);
}

export function installState(cb: (event: IpcRendererEvent, state: IpcRendererEventData) => void) {
  return ipcRenderer.on(IPC_EVENTS.INSTALL_STATE, cb);
}

export async function isExplorerInstalled(): Promise<boolean> {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.IS_EXPLORER_INSTALLED);
  return resp;
}

export async function isExplorerUpdated(version: string): Promise<boolean> {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.IS_EXPLORER_UPDATED, version);
  return resp;
}

export function openApp(app: string) {
  ipcRenderer.invoke(IPC_HANDLERS.OPEN_APP, app);
}

export function openAppState(cb: (event: IpcRendererEvent, state: IpcRendererEventData) => void) {
  return ipcRenderer.on(IPC_EVENTS.OPEN_APP, cb);
}

export function minimize() {
  ipcRenderer.invoke(IPC_HANDLERS.MINIMIZE_WINDOW);
}
