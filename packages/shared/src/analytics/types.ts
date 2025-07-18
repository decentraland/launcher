export enum ANALYTICS_EVENT {
  LAUNCHER_OPEN = 'Launcher Open',
  LAUNCHER_CLOSE = 'Launcher Close',
  DOWNLOAD_VERSION = 'Download Version',
  DOWNLOAD_VERSION_SUCCESS = 'Download Version Success',
  DOWNLOAD_VERSION_ERROR = 'Download Version Error',
  DOWNLOAD_VERSION_CANCELLED = 'Download Version Cancelled',
  INSTALL_VERSION_START = 'Install Version Start',
  INSTALL_VERSION_SUCCESS = 'Install Version Success',
  INSTALL_VERSION_ERROR = 'Install Version Error',
  LAUNCH_CLIENT_START = 'Launch Client Start',
  LAUNCH_CLIENT_SUCCESS = 'Launch Client Success',
  LAUNCH_CLIENT_ERROR = 'Launch Client Error',
  LAUNCHER_UPDATE_CHECKING = 'Launcher Update Checking',
  LAUNCHER_UPDATE_AVAILABLE = 'Launcher Update Available',
  LAUNCHER_UPDATE_NOT_AVAILABLE = 'Launcher Update Not Available',
  LAUNCHER_UPDATE_CANCELLED = 'Launcher Update Cancelled',
  LAUNCHER_UPDATE_ERROR = 'Launcher Update Error',
  LAUNCHER_UPDATE_DOWNLOADED = 'Launcher Update Downloaded',
  DOWNLOAD_LAUNCHER = 'Download New Launcher',
  DOWNLOAD_LAUNCHER_SUCCESS = 'Download New Launcher Success',
  DOWNLOAD_LAUNCHER_ERROR = 'Download New Launcher Error',
  DOWNLOAD_LAUNCHER_CANCELLED = 'Download New Launcher Cancelled',
}

export type ANALYTICS_EVENTS = {
  [ANALYTICS_EVENT.LAUNCHER_OPEN]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCHER_CLOSE]: {
    version: string;
  };
  [ANALYTICS_EVENT.DOWNLOAD_VERSION]: {
    version: string;
  };
  [ANALYTICS_EVENT.DOWNLOAD_VERSION_SUCCESS]: {
    version: string;
  };
  [ANALYTICS_EVENT.DOWNLOAD_VERSION_ERROR]: {
    version: string | undefined;
    error: string;
  };
  [ANALYTICS_EVENT.DOWNLOAD_VERSION_CANCELLED]: {
    version: string;
  };
  [ANALYTICS_EVENT.INSTALL_VERSION_START]: {
    version: string;
  };
  [ANALYTICS_EVENT.INSTALL_VERSION_SUCCESS]: {
    version: string;
  };
  [ANALYTICS_EVENT.INSTALL_VERSION_ERROR]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCH_CLIENT_START]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCH_CLIENT_SUCCESS]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCH_CLIENT_ERROR]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCHER_UPDATE_CHECKING]: void;
  [ANALYTICS_EVENT.LAUNCHER_UPDATE_AVAILABLE]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCHER_UPDATE_NOT_AVAILABLE]: void;
  [ANALYTICS_EVENT.LAUNCHER_UPDATE_CANCELLED]: {
    version: string;
  };
  [ANALYTICS_EVENT.LAUNCHER_UPDATE_ERROR]: {
    version: string;
    error: string;
  };
  [ANALYTICS_EVENT.LAUNCHER_UPDATE_DOWNLOADED]: {
    version: string;
  };
  [ANALYTICS_EVENT.DOWNLOAD_LAUNCHER]: void;
  [ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_SUCCESS]: void;
  [ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_ERROR]: {
    error: string;
  };
  [ANALYTICS_EVENT.DOWNLOAD_LAUNCHER_CANCELLED]: void;
};
