import {IpcRendererEvent} from 'electron';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Box, Button, Typography} from 'decentraland-ui2';
import log from 'electron-log/renderer';
import {
  downloadApp,
  openApp,
  isExplorerInstalled,
  isExplorerUpdated,
  downloadState,
  installState,
  minimize,
  getOSName,
} from '#preload';
import {
  IPC_EVENT_DATA_TYPE,
  IpcRendererEventDataError,
  IpcRendererDownloadProgressStateEventData,
  IpcRendererEventData,
} from '#shared';
import {APPS, AppState, GithubReleaseResponse} from './types';
import {Landscape, LoadingBar} from './Home.styles';

import LANDSCAPE_IMG from '/@assets/landscape.png';

const ONE_SECOND = 1000;
const FIVE_SECONDS = 5 * ONE_SECOND;

async function getLatestRelease(): Promise<GithubReleaseResponse> {
  try {
    const resp = await fetch(
      `https://api.github.com/repos/decentraland/${APPS.Explorer}/releases/latest`,
    );
    if (resp.status === 200) {
      const data = await resp.json();
      const os = await getOSName();
      const asset = data.assets.find((asset: Record<string, string>) =>
        asset.name.includes(os.toLowerCase()),
      );
      if (asset) {
        return {
          browser_download_url: asset.browser_download_url,
          version: data.name,
        };
      } else {
        throw new Error('No asset found for your platform');
      }
    }

    throw new Error('Failed to fetch latest release: ' + JSON.stringify(resp));
  } catch (error) {
    throw error;
  }
}

export const Home: React.FC = React.memo(() => {
  const initialized = useRef(false);
  const openedApp = useRef(false);
  const [state, setState] = useState<AppState | undefined>(undefined);
  const [isUpdated, setIsUpdated] = useState(false);
  const [downloadUrl, setDownloadUrl] = React.useState<string | undefined>(undefined);
  const [downloadingProgress, setDownloadingProgress] = React.useState(0);
  const [downloadRetry, setDownloadRetry] = React.useState(0);
  const [installRetry, setInstallRetry] = React.useState(0);
  const [error, setError] = React.useState<string | undefined>(undefined);

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
          log.error(
            '[Renderer][Home][HandleInstallState]',
            (eventData as IpcRendererEventDataError).error,
          );
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
          log.error(
            '[Renderer][Home][HandleDownloadState]',
            (eventData as IpcRendererEventDataError).error,
          );
          handleRetryDownload();
          break;
      }
    },
    [
      handleInstall,
      handleRetryDownload,
      setDownloadingProgress,
      setDownloadRetry,
      setError,
      setState,
    ],
  );

  const handleDownload = useCallback((url: string | undefined) => {
    if (!url) return;
    downloadApp(url);
    downloadState(handleDownloadState);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      getLatestRelease()
        .then(async ({browser_download_url: url, version}) => {
          setDownloadUrl(url);
          const isInstalled = await isExplorerInstalled();
          if (!isInstalled) {
            handleDownload(url);
            return;
          }
          setState(AppState.Installed);

          const _isUpdated = await isExplorerUpdated(version);
          if (!_isUpdated) {
            handleDownload(url);
            return;
          }
          setIsUpdated(true);
        })
        .catch(error => {
          setError(error.message);
          log.error('[Renderer][Home][GetLatestRelease]', error);
        });
    }
  }, []);

  const renderDownloadStep = useCallback(() => {
    const isUpdating = state === AppState.Installing && !isUpdated;

    return (
      <Box>
        <Typography
          variant="h4"
          align="center"
        >
          Downloading {isUpdating ? 'Update' : null}
        </Typography>
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <LoadingBar
            variant="determinate"
            value={downloadingProgress}
            sx={{mr: 1}}
          />
          <Typography variant="body1">{`${Math.round(downloadingProgress)}%`}</Typography>
        </Box>
      </Box>
    );
  }, [downloadingProgress, state, isUpdated]);

  const renderInstallStep = useCallback(() => {
    const isUpdating = state === AppState.Installing && !isUpdated;

    return (
      <Box>
        <Typography
          variant="h4"
          align="center"
        >
          Installing {isUpdating ? 'Update' : null}
        </Typography>
        <Box
          paddingTop={'10px'}
          paddingBottom={'10px'}
        >
          <LoadingBar />
        </Box>
      </Box>
    );
  }, [state, isUpdated]);

  const renderLaunchStep = useCallback(() => {
    if (openedApp.current === false) {
      openedApp.current = true;
      setTimeout(() => {
        openApp(APPS.Explorer);
        minimize();
      }, ONE_SECOND);
    }

    return <Typography variant="h4">Launching</Typography>;
  }, []);

  const renderError = useCallback(() => {
    const isDownloading = state === AppState.Downloading;
    const isInstalling = state === AppState.Installing;
    const isRetrying = (isDownloading && downloadRetry < 5) || (isInstalling && installRetry < 5);

    if (!isRetrying) {
      return (
        <Box>
          <Typography
            variant="h4"
            align="center"
          >
            {isDownloading ? 'Download failed' : 'Install failed'}
          </Typography>
          <Typography
            variant="body1"
            align="center"
          >
            {isDownloading
              ? 'Please check your internet connection and try again.'
              : 'Please try again.'}
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            marginTop={'10px'}
          >
            <Button
              onClick={() => (isDownloading ? handleRetryDownload(true) : handleRetryInstall(true))}
            >
              Retry
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box>
        <Typography
          variant="h4"
          align="center"
        >
          Retrying...
        </Typography>
      </Box>
    );
  }, [downloadRetry, installRetry, state]);

  return (
    <Box
      display="flex"
      alignItems={'center'}
      justifyContent={'center'}
      width={'100%'}
    >
      <Landscape>
        <img src={LANDSCAPE_IMG} />
      </Landscape>
      {state === AppState.Downloading
        ? renderDownloadStep()
        : state === AppState.Installing
        ? renderInstallStep()
        : !!isUpdated
        ? renderLaunchStep()
        : !!error
        ? renderError()
        : null}
    </Box>
  );
});
