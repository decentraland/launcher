export enum IPC_HANDLERS {
  DOWNLOAD_EXPLORER = 'download-explorer',
  DOWNLOAD_LAUNCHER = 'download-launcher',
  INSTALL_EXPLORER = 'install-explorer',
  IS_EXPLORER_INSTALLED = 'is-explorer-installed',
  IS_EXPLORER_UPDATED = 'is-explorer-updated',
  LAUNCH_EXPLORER = 'launch-explorer',
  GET_PLATFORM = 'get-platform',
  GET_OS_NAME = 'get-os-name',
  GET_ARCH = 'get-arch',
}

export enum IPC_EVENTS {
  DOWNLOAD_STATE = 'downloadState',
  INSTALL_STATE = 'installState',
  LAUNCH_EXPLORER = 'launchExplorer',
}

export enum IPC_EVENT_DATA_TYPE {
  START = 'START',
  PROGRESS = 'PROGRESS',
  COMPLETED = 'COMPLETED',
  LAUNCH = 'LAUNCH',
  LAUNCHED = 'LAUNCHED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  CLOSE = 'CLOSE',
}

export interface IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE;
  error?: string;
}

export interface IpcRendererDownloadProgressStateEventData extends IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE.PROGRESS;
  progress: number;
}

export interface IpcRendererDownloadCompletedEventData extends IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE.COMPLETED;
  version: string;
}

export interface IpcRendererEventDataError extends IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE.ERROR;
  error: string;
}
