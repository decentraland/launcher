export enum IPC_HANDLERS {
  DOWNLOAD_EXPLORER = 'download-explorer',
  IS_EXPLORER_INSTALLED = 'is-explorer-installed',
  IS_EXPLORER_UPDATED = 'is-explorer-updated',
  LAUNCH_EXPLORER = 'launch-explorer',
  GET_OS_NAME = 'get-os-name',
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
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  LAUNCH = 'LAUNCH',
  LAUNCHED = 'LAUNCHED',
  CLOSE = 'CLOSE',
  LAUNCH = 'LAUNCH',
  LAUNCHED = 'LAUNCHED',
}

export interface IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE;
  error?: string;
}

export interface IpcRendererDownloadProgressStateEventData extends IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE.PROGRESS;
  progress: number;
}

export interface IpcRendererEventDataError extends IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE.ERROR;
  error: string;
}
