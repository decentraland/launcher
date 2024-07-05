export interface Props {
  app: keyof typeof APPS;
}

export enum APPS {
  Explorer = 'unity-explorer',
  Editor = 'unity-explorer',
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
