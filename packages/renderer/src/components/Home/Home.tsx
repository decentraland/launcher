import {IpcRendererEvent} from 'electron';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Box, Button, LinearProgress, Typography} from 'decentraland-ui2';
import {
  platform,
  downloadApp,
  openApp,
  isExplorerInstalled,
  isExplorerUpdated,
  downloadState,
  installState,
} from '#preload';
import {
  IPC_EVENT_DATA_TYPE,
  IpcRendererEventDataError,
  IpcRendererDownloadProgressStateEventData,
  IpcRendererEventData,
} from '#shared';
import {APPS, AppState, PLATFORMS, GithubReleaseResponse} from './types';
import {Landscape, LoadingBar} from './Home.styles';

import LANDSCAPE_IMG from '/@assets/landscape.png';

async function getLatestRelease(): Promise<GithubReleaseResponse> {
  try {
    const resp = await fetch(
      `https://api.github.com/repos/decentraland/${APPS.Explorer}/releases/latest`,
    );
    if (resp.status === 200) {
      const data = await resp.json();
      const asset = data.assets.find((asset: Record<string, string>) =>
        asset.name.includes(PLATFORMS[platform].toLowerCase()),
      );
      if (asset) {
        console.log('Found the asset for your platform', {asset});
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
    console.error('Failed to fetch latest release', error);
    throw error;
  }
}

export const Home: React.FC = React.memo(() => {
  const initialized = useRef(false);
  const openedApp = useRef(false);
  const [state, setState] = useState<AppState | undefined>(undefined);
  const [isUpdated, setIsUpdated] = useState(false);
  const [downloadingProgress, setDownloadingProgress] = React.useState(0);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const isUpdating = state === AppState.Installing && !isUpdated;

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
          break;
        case IPC_EVENT_DATA_TYPE.CANCELLED:
          setState(AppState.Cancelled);
          break;
        case IPC_EVENT_DATA_TYPE.ERROR:
          setState(AppState.Error);
          setError((eventData as IpcRendererEventDataError).error);
          break;
      }
    },
    [setDownloadingProgress, setError, setState],
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
          setState(AppState.Error);
          setError((eventData as IpcRendererEventDataError).error);
          break;
      }
    },
    [setError, setIsUpdated, setState],
  );

  const handleDownloadAndInstall = useCallback((url: string) => {
    downloadApp(url);
    downloadState(handleDownloadState);
    installState(handleInstallState);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      getLatestRelease()
        .then(async ({browser_download_url: url, version}) => {
          const isInstalled = await isExplorerInstalled();
          if (!isInstalled) {
            handleDownloadAndInstall(url);
            return;
          }
          setState(AppState.Installed);

          const _isUpdated = await isExplorerUpdated(version);
          if (!_isUpdated) {
            handleDownloadAndInstall(url);
            return;
          }
          setIsUpdated(true);
        })
        .catch(error => {
          console.error(error);
          setError(error);
        });
    }
  }, []);

  const renderDownloadStep = useCallback(
    () => (
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
    ),
    [downloadingProgress],
  );

  const renderInstallStep = useCallback(
    () => (
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
    ),
    [],
  );

  const renderLaunchStep = useCallback(() => {
    if (openedApp.current === false) {
      openedApp.current = true;
      setTimeout(() => {
        openApp(APPS.Explorer);
        close();
      }, 1000);
    }

    return <Typography variant="h4">Launching</Typography>;
  }, []);

  const renderError = useCallback(
    () => (
      <Box>
        <Typography
          variant="h4"
          align="center"
        >
          {error}
        </Typography>
      </Box>
    ),
    [error],
  );

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
