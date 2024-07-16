export enum APPS {
  Explorer = 'unity-explorer'
}

export interface GithubReleaseResponse {
  browser_download_url: string
  version: string
}

export enum AppState {
  Downloading,
  Downloaded,
  Installing,
  Installed,
  Cancelled,
  Error
}
