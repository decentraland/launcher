export enum APPS {
  Explorer = 'unity-explorer',
}

export const PLATFORMS: Record<string, string> = {
  darwin: 'Macos',
  win32: 'Windows',
  aix: 'aix',
  freebsd: 'FreeBSD',
  linux: 'linux',
  openbsd: 'OpenBSD',
  sunos: 'SunOS',
  android: 'Android',
};

export interface GithubReleaseResponse {
  browser_download_url: string;
  version: string;
}

export enum AppState {
  Downloading,
  Downloaded,
  Installing,
  Installed,
  Cancelled,
  Error,
}
