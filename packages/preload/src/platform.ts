import { ipcRenderer } from 'electron';
import { IPC_HANDLERS, type PLATFORM } from '#shared';

export async function getPlatform(): Promise<string> {
  return ipcRenderer.invoke(IPC_HANDLERS.GET_PLATFORM);
}

export async function getOSName(): Promise<PLATFORM> {
  return ipcRenderer.invoke(IPC_HANDLERS.GET_OS_NAME);
}

export async function getArch(): Promise<string> {
  return ipcRenderer.invoke(IPC_HANDLERS.GET_ARCH);
}
