import { IpcRendererEvent } from 'electron';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from 'decentraland-ui2';
import log from 'electron-log/renderer';
import {
  downloadExplorer,
  downloadState,
  installExplorer,
  installState,
  launchExplorer,
  launchState,
  isExplorerInstalled,
  isExplorerUpdated,
  getOSName,
  getVersion,
  getIsPrerelease,
  getRunDevVersion,
  getDownloadedFilePath,
} from '#preload';
import {
  IPC_EVENT_DATA_TYPE,
  IpcRendererEventDataError,
  IpcRendererDownloadProgressStateEventData,
  IpcRendererEventData,
  getErrorMessage,
  IpcRendererDownloadCompletedEventData,
} from '#shared';
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

  if (error instanceof Object) {
    if ('message' in error) {
      return error.message as string;
    }

    if ('status' in error) {
      return `Status: ${error.status}`;
    }
  }

  return 'An error occurred';
}

/**
 * Retrieves the latest release information from the GitHub API.
 * @param version - Optional. The specific version to retrieve. If not provided, retrieves the latest version.
 * @param isPrerelease - Optional. Specifies whether to retrieve a prerelease version. Default is false.
 * @returns A Promise that resolves to the latest release information.
 * @throws An error if no asset is found for the specified platform or if the API request fails.
 */
async function getLatestRelease(version?: string, isPrerelease: boolean = false): Promise<GithubReleaseResponse> {
  try {
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

    const _resp = await resp.json();
    throw new Error(getErrorMessage(_resp));
  } catch (error) {
    log.error('[Renderer][Home][GetLatestRelease]', error);
    throw new Error('Failed to fetch latest release');
  }
}

export const Home: React.FC = memo(() => {
  const initialized = useRef(false);
  const [state, setState] = useState<AppState | undefined>(undefined);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined);
  const [downloadingProgress, setDownloadingProgress] = useState(0);
  const [downloadedVersion, setDownloadedVersion] = useState<string | undefined>(undefined);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  const shouldRunDevVersion = getRunDevVersion();
  const customDownloadedFilePath = getDownloadedFilePath();
  const isFetching = state === AppState.Fetching;
  const isDownloading = state === AppState.Downloading;
  const isInstalling = state === AppState.Installing;
  const isLaunching = state === AppState.Launching;

  const handleFetch = useCallback(async () => {
    try {
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
      setRetry(0);
      handleLaunch();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(getErrorMessage(errorMessage));
      log.error('[Renderer][Home][GetLatestRelease]', errorMessage);
      handleRetryFetch();
    }
  }, [setDownloadUrl, setError, setIsInstalled, setIsUpdated, setState]);

  const handleRetryFetch = useCallback(
    (manualRetry: boolean = false) => {
      if (!manualRetry && retry >= 5) {
        return;
      }

      setRetry(retry + 1);
      setTimeout(() => {
        handleFetch();
      }, FIVE_SECONDS);
    },
    [retry],
  );

  const handleLaunch = useCallback((version?: string) => {
    const _version = shouldRunDevVersion ? 'dev' : (version ?? getVersion());
    setTimeout(() => {
      launchExplorer(APPS.Explorer, _version);
      launchState(handleLaunchState);
    }, ONE_SECOND);
  }, []);

  const handleLaunchState = useCallback(
    (_event: IpcRendererEvent, eventData: IpcRendererEventData) => {
      switch (eventData.type) {
        case IPC_EVENT_DATA_TYPE.LAUNCH:
          setState(AppState.Launching);
          break;
        case IPC_EVENT_DATA_TYPE.LAUNCHED:
          setState(AppState.Launched);
          break;
        case IPC_EVENT_DATA_TYPE.ERROR:
          setError((eventData as IpcRendererEventDataError).error);
          log.error('[Renderer][Home][HandleLaunchState]', (eventData as IpcRendererEventDataError).error);
          break;
      }
    },
    [setError, setState],
  );

  const handleRetryInstall = useCallback(
    (manualRetry: boolean = false) => {
      if (!manualRetry && retry >= 5) {
        return;
      }

      if (!downloadedVersion) {
        return;
      }

      setRetry(retry + 1);
      setTimeout(() => {
        handleInstall(downloadedVersion);
      }, FIVE_SECONDS);
    },
    [downloadedVersion, retry],
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
          setRetry(0);
          handleLaunch();
          break;
        case IPC_EVENT_DATA_TYPE.ERROR:
          setError((eventData as IpcRendererEventDataError).error);
          log.error('[Renderer][Home][HandleInstallState]', (eventData as IpcRendererEventDataError).error);
          handleRetryInstall();
          break;
      }
    },
    [handleLaunch, handleRetryInstall, setError, setIsUpdated, setRetry, setState],
  );

  const handleInstall = useCallback((version: string, downloadedFilePath?: string) => {
    installExplorer(version, downloadedFilePath);
    installState(handleInstallState);
  }, []);

  const handleRetryDownload = useCallback(
    (manualRetry: boolean = false) => {
      if (!downloadUrl) {
        throw new Error('Not available downloadable release found.');
      }

      if (!manualRetry && retry >= 5) {
        return;
      }

      setRetry(retry + 1);
      setTimeout(() => {
        handleDownload(downloadUrl);
      }, FIVE_SECONDS);
    },
    [retry, downloadUrl],
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
        case IPC_EVENT_DATA_TYPE.COMPLETED: {
          const downloadeVersion = (eventData as IpcRendererDownloadCompletedEventData).version;
          setState(AppState.Downloaded);
          setDownloadedVersion(downloadeVersion);
          setRetry(0);
          handleInstall(downloadeVersion);
          break;
        }
        case IPC_EVENT_DATA_TYPE.CANCELLED: {
          const downloadeVersion = (eventData as IpcRendererDownloadCompletedEventData)?.version;
          if (downloadeVersion) {
            handleLaunch(downloadeVersion);
          } else {
            setState(AppState.Cancelled);
          }
          break;
        }
        case IPC_EVENT_DATA_TYPE.ERROR:
          setError((eventData as IpcRendererEventDataError).error);
          log.error('[Renderer][Home][HandleDownloadState]', (eventData as IpcRendererEventDataError).error);
          handleRetryDownload();
          break;
      }
    },
    [handleInstall, handleRetryDownload, setDownloadingProgress, setDownloadedVersion, setError, setRetry, setState],
  );

  const handleDownload = useCallback((url: string) => {
    downloadExplorer(url);
    downloadState(handleDownloadState);
  }, []);

  useEffect(() => {
    const fetchReleaseData = async () => {
      if (!initialized.current) {
        initialized.current = true;
        // When running with the param --version=dev, skip all the checks and launch the app
        if (shouldRunDevVersion) {
          handleLaunch();
        }
        // When running with the param --downloadedfilepath={{PATH}}, skip the download step and try to install the .zip provided
        else if (customDownloadedFilePath) {
          handleInstall('dev', customDownloadedFilePath);
        }
        // Fetch the latest available version of Decentraland from the github repo releases
        else {
          await handleFetch();
        }
      }
    };

    fetchReleaseData();
  }, []);

  const renderFetchStep = useCallback(() => {
    return <Typography variant="h4">Fetching the latest available version of Decentraland</Typography>;
  }, []);

  const renderDownloadStep = useCallback(() => {
    const isUpdating = isInstalling && isInstalled && !isUpdated;

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
    const isUpdating = isInstalling && isInstalled && !isUpdated;

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
    return <Typography variant="h4">Launching Decentraland</Typography>;
  }, []);

  const handleOnClickRetry = useCallback(() => {
    if (isFetching) {
      return handleRetryFetch(true);
    } else if (isDownloading) {
      return handleRetryDownload(true);
    } else if (isInstalling) {
      return handleRetryInstall(true);
    } else if (isLaunching) {
      return handleLaunch();
    } else {
      return null;
    }
  }, []);

  const renderError = useCallback(() => {
    const isRetrying = (isFetching || isDownloading || isInstalling) && retry < 5;
    const shouldShowRetryButton = !isRetrying || isLaunching;

    if (shouldShowRetryButton) {
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
            <Button onClick={handleOnClickRetry}>Retry</Button>
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
  }, [error, retry, state]);

  return (
    <Box display="flex" alignItems={'center'} justifyContent={'center'} width={'100%'}>
      <Landscape>
        <img src={LANDSCAPE_IMG} />
      </Landscape>
      {error
        ? renderError()
        : isFetching
          ? renderFetchStep()
          : isDownloading
            ? renderDownloadStep()
            : isInstalling
              ? renderInstallStep()
              : isLaunching
                ? renderLaunchStep()
                : null}
    </Box>
  );
});
