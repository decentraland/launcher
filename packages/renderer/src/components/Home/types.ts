export enum APPS {
  Explorer = 'unity-explorer',
}

export interface GithubReleaseResponse {
  browser_download_url: string;
  version: string;
}

export interface GithubRelease {
  tag_name: string;
  name: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
  draft: boolean;
  prerelease: boolean;
}

export enum AppState {
  Fetching,
  Downloading,
  Downloaded,
  Installing,
  Installed,
  Cancelled,
  Error,
}
