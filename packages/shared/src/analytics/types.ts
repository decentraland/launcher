export enum ANALYTICS_EVENT {
  LAUNCHER_OPEN = 'Launcher Open',
  LAUNCHER_CLOSE = 'Launcher Close',
  DOWNLOAD_VERSION = 'Download Version',
  DOWNLOAD_VERSION_ERROR = 'Download Version Error',
  INSTALL_VERSION_START = 'Install Version Start',
  INSTALL_VERSION_SUCCESS = 'Install Version Success',
  INSTALL_VERSION_ERROR = 'Install Version Error',
  LAUNCH_CLIENT_START = 'Launch Client Start',
  LAUNCH_CLIENT_SUCCESS = 'Launch Client Success',
  LAUNCH_CLIENT_ERROR = 'Launch Client Error',
}

export type ANALYTICS_EVENTS = {
  [ANALYTICS_EVENT.LAUNCHER_OPEN]: Record<string, never>;
  [ANALYTICS_EVENT.LAUNCHER_CLOSE]: Record<string, never>;
  [ANALYTICS_EVENT.DOWNLOAD_VERSION]: {
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
};
