export enum IPC_HANDLERS {
  DOWNLOAD_APP = 'download-app',
  IS_EXPLORER_INSTALLED = 'is-explorer-installed',
  IS_EXPLORER_UPDATED = 'is-explorer-updated',
  OPEN_APP = 'open-app',
}

export enum IPC_EVENTS {
  DOWNLOAD_STATE = 'downloadState',
  INSTALL_STATE = 'installState',
  OPEN_APP = 'openApp',
}

export enum IPC_EVENT_DATA_TYPE {
  START = 'START',
  PROGRESS = 'PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  OPEN = 'OPEN',
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

export interface IpcRendererEventDataError extends IpcRendererEventData {
  type: IPC_EVENT_DATA_TYPE.ERROR;
  error: string;
}
