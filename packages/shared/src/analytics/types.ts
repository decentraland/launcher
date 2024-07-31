export enum ANALYTICS_EVENT {
  DOWNLOAD_VERSION = 'Download Version',
  DOWNLOAD_VERSION_ERROR = 'Download Version Error',
  INSTALL_VERSION_START = 'Install Version Start',
  INSTALL_VERSION_SUCCESS = 'Install Version Success',
  INSTALL_VERSION_ERROR = 'Install Version Error',
}

export type ANALYTICS_EVENTS = {
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
};
