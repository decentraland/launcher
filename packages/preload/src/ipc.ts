import { ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_EVENTS, IPC_HANDLERS, type IpcRendererEventData } from '#shared';

export function downloadExplorer(url: string) {
  ipcRenderer.invoke(IPC_HANDLERS.DOWNLOAD_EXPLORER, url);
}

export function downloadLauncher() {
  ipcRenderer.invoke(IPC_HANDLERS.DOWNLOAD_LAUNCHER);
}

export function downloadState(cb: (event: IpcRendererEvent, state: IpcRendererEventData) => void) {
  return ipcRenderer.on(IPC_EVENTS.DOWNLOAD_STATE, cb);
}

export function installExplorer(version: string, downloadedFilePath?: string) {
  ipcRenderer.invoke(IPC_HANDLERS.INSTALL_EXPLORER, version, downloadedFilePath);
}

export function installState(cb: (event: IpcRendererEvent, state: IpcRendererEventData) => void) {
  return ipcRenderer.on(IPC_EVENTS.INSTALL_STATE, cb);
}

export async function isExplorerInstalled(version?: string): Promise<boolean> {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.IS_EXPLORER_INSTALLED, version);
  return resp;
}

export async function isExplorerUpdated(version: string): Promise<boolean> {
  const resp = await ipcRenderer.invoke(IPC_HANDLERS.IS_EXPLORER_UPDATED, version);
  return resp;
}

export function launchExplorer(version?: string) {
  ipcRenderer.invoke(IPC_HANDLERS.LAUNCH_EXPLORER, version);
}

export function launchState(cb: (event: IpcRendererEvent, state: IpcRendererEventData) => void) {
  return ipcRenderer.on(IPC_EVENTS.LAUNCH_EXPLORER, cb);
}
