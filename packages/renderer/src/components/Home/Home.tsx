import { IpcRendererEvent } from 'electron';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from 'decentraland-ui2';
import log from 'electron-log/renderer';
import {
  downloadApp,
  openApp,
  isExplorerInstalled,
  isExplorerUpdated,
  downloadState,
  installState,
  getOSName,
  getVersion,
  getIsPrerelease,
} from '#preload';
import { IPC_EVENT_DATA_TYPE, IpcRendererEventDataError, IpcRendererDownloadProgressStateEventData, IpcRendererEventData } from '#shared';
import { APPS, AppState, GithubReleaseResponse, GithubRelease } from './types';
import { Landscape, LoadingBar } from './Home.styles';
import LANDSCAPE_IMG from '/@assets/landscape.png';

const ONE_SECOND = 1000;
const FIVE_SECONDS = 5 * ONE_SECOND;

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An error occurred';
}

async function getLatestRelease(version?: string, isPrerelease?: boolean): Promise<GithubReleaseResponse> {
  const resp = await fetch(`https://api.github.com/repos/decentraland/${APPS.Explorer}/releases`);
  if (resp.status === 200) {
    const releases: GithubRelease[] = await resp.json();
    const os = await getOSName();
    let isMatchingOS = false;
    let isValidVersion = false;
    let isValidPrerelease = false;

    for (const release of releases) {
      for (const asset of release.assets) {
        isMatchingOS = asset.name.toLowerCase().includes(os.toLowerCase());
        isValidVersion = !version || version === release.name;
        isValidPrerelease = !isPrerelease || (isPrerelease && !!release.prerelease);
        if (isMatchingOS && isValidVersion && isValidPrerelease) {
          return {
            browser_download_url: asset.browser_download_url,
            version: release.name,
          };
        }
      }
    }

    if (!isMatchingOS) {
      throw new Error('No asset found for your platform');
    } else if (!isValidVersion) {
      throw new Error('No asset found for the specified version');
    } else if (!isValidPrerelease) {
      throw new Error('No asset found with the prerelease flag');
    }
  }

  throw new Error('Failed to fetch latest release');
}

export const Home: React.FC = memo(() => {
  const initialized = useRef(false);
  const openedApp = useRef(false);
  const [state, setState] = useState<AppState | undefined>(undefined);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined);
  const [downloadingProgress, setDownloadingProgress] = useState(0);
  const [fetchRetry, setFetchRetry] = useState<boolean>(false);
  const [downloadRetry, setDownloadRetry] = useState(0);
  const [installRetry, setInstallRetry] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleRetryFetchAssets = useCallback(() => {
    setFetchRetry(true);
  }, []);

  const handleRetryInstall = useCallback(
    (manualRetry: boolean = false) => {
      if (!manualRetry && installRetry >= 5) {
        return;
      }

      setInstallRetry(installRetry + 1);
      setTimeout(() => {
        handleInstall();
      }, FIVE_SECONDS);
    },
    [installRetry],
  );

  const handleInstallState = useCallback(
    (_event: IpcRendererEvent, eventData: IpcRendererEventData) => {
      switch (eventData.type) {
        case IPC_EVENT_DATA_TYPE.START:
          setState(AppState.Installing);
          break;
        case IPC_EVENT_DATA_TYPE.COMPLETED:
          setState(AppState.Installed);
          setIsUpdated(true);
          break;
        case IPC_EVENT_DATA_TYPE.ERROR:
          setError((eventData as IpcRendererEventDataError).error);
          log.error('[Renderer][Home][HandleInstallState]', (eventData as IpcRendererEventDataError).error);
          handleRetryInstall();
          break;
      }
    },
    [handleRetryInstall, setError, setIsUpdated, setState],
  );

  const handleInstall = useCallback(() => {
    installState(handleInstallState);
  }, []);

  const handleRetryDownload = useCallback(
    (manualRetry: boolean = false) => {
      if (!manualRetry && downloadRetry >= 5) {
        return;
      }

      setDownloadRetry(downloadRetry + 1);
      setTimeout(() => {
        handleDownload(downloadUrl);
      }, FIVE_SECONDS);
    },
    [downloadRetry, downloadUrl],
  );

  const handleDownloadState = useCallback(
    (_event: IpcRendererEvent, eventData: IpcRendererEventData) => {
      switch (eventData.type) {
        case IPC_EVENT_DATA_TYPE.START:
          setState(AppState.Downloading);
          break;
        case IPC_EVENT_DATA_TYPE.PROGRESS:
          setDownloadingProgress((eventData as IpcRendererDownloadProgressStateEventData).progress);
          break;
        case IPC_EVENT_DATA_TYPE.COMPLETED:
          setState(AppState.Downloaded);
          handleInstall();
          break;
        case IPC_EVENT_DATA_TYPE.CANCELLED:
          setState(AppState.Cancelled);
          break;
        case IPC_EVENT_DATA_TYPE.ERROR:
          setError((eventData as IpcRendererEventDataError).error);
          log.error('[Renderer][Home][HandleDownloadState]', (eventData as IpcRendererEventDataError).error);
          handleRetryDownload();
          break;
      }
    },
    [handleInstall, handleRetryDownload, setDownloadingProgress, setDownloadRetry, setError, setState],
  );

  const handleDownload = useCallback((url: string | undefined) => {
    if (!url) return;
    downloadApp(url);
    downloadState(handleDownloadState);
  }, []);

  useEffect(() => {
    const fetchReleaseData = async () => {
      if (!initialized.current) {
        try {
          setState(AppState.Fetching);
          const { browser_download_url: url, version } = await getLatestRelease(getVersion(), getIsPrerelease());
          setDownloadUrl(url);
          const _isInstalled = await isExplorerInstalled();
          if (!_isInstalled) {
            handleDownload(url);
            return;
          }
          setIsInstalled(true);
          setState(AppState.Installed);

          const _isUpdated = await isExplorerUpdated(version);
          if (!_isUpdated) {
            handleDownload(url);
            return;
          }
          setIsUpdated(true);
          initialized.current = true;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          setError(getErrorMessage(errorMessage));
          log.error('[Renderer][Home][GetLatestRelease]', errorMessage);
          initialized.current = false;
        } finally {
          setFetchRetry(false);
        }
      }
    };

    fetchReleaseData();
  }, [fetchRetry]);

  const renderDownloadStep = useCallback(() => {
    const isUpdating = state === AppState.Installing && isInstalled && !isUpdated;

    return (
      <Box>
        <Typography variant="h4" align="center">
          {isUpdating ? 'Downloading Update' : 'Downloading Decentraland'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingBar variant="determinate" value={downloadingProgress} sx={{ mr: 1 }} />
          <Typography variant="body1">{`${Math.round(downloadingProgress)}%`}</Typography>
        </Box>
      </Box>
    );
  }, [downloadingProgress, state, isInstalled, isUpdated]);

  const renderInstallStep = useCallback(() => {
    const isUpdating = state === AppState.Installing && isInstalled && !isUpdated;

    return (
      <Box>
        <Typography variant="h4" align="center">
          {isUpdating ? 'Installing Update' : 'Installation in Progress'}
        </Typography>
        <Box paddingTop={'10px'} paddingBottom={'10px'}>
          <LoadingBar />
        </Box>
      </Box>
    );
  }, [state, isInstalled, isUpdated]);

  const renderLaunchStep = useCallback(() => {
    if (openedApp.current === false) {
      openedApp.current = true;
      setTimeout(() => {
        openApp(APPS.Explorer);
      }, ONE_SECOND);
    }

    return <Typography variant="h4">Launching Decentraland</Typography>;
  }, []);

  const renderError = useCallback(() => {
    const isFetching = state === AppState.Fetching;
    const isDownloading = state === AppState.Downloading;
    const isInstalling = state === AppState.Installing;
    const isRetrying = (isDownloading && downloadRetry < 5) || (isInstalling && installRetry < 5);
    const shouldRetry = isFetching || !isRetrying;

    if (shouldRetry) {
      return (
        <Box>
          <Typography variant="h4" align="center">
            {isFetching
              ? 'Fetch the latest client version failed'
              : isDownloading
                ? 'Download failed'
                : isInstalling
                  ? 'Install failed'
                  : 'Error'}
          </Typography>
          <Typography variant="body1" align="center">
            {isFetching || isDownloading
              ? 'Please check your internet connection and try again.'
              : isInstalling
                ? 'Please try again.'
                : error}
          </Typography>
          <Box display="flex" justifyContent="center" marginTop={'10px'}>
            <Button
              onClick={() => (isFetching ? handleRetryFetchAssets() : isDownloading ? handleRetryDownload(true) : handleRetryInstall(true))}
            >
              Retry
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h4" align="center">
          Retrying...
        </Typography>
      </Box>
    );
  }, [error, downloadRetry, installRetry, state]);

  return (
    <Box display="flex" alignItems={'center'} justifyContent={'center'} width={'100%'}>
      <Landscape>
        <img src={LANDSCAPE_IMG} />
      </Landscape>
      {state === AppState.Downloading
        ? renderDownloadStep()
        : state === AppState.Installing
          ? renderInstallStep()
          : isUpdated
            ? renderLaunchStep()
            : error
              ? renderError()
              : null}
    </Box>
  );
});
