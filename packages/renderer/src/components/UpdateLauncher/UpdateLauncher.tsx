import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { IpcRendererEvent } from 'electron';
import log from 'electron-log/renderer';
import { Box, Typography } from 'decentraland-ui2/';
import { Button } from 'decentraland-ui2/dist/components/Button';
import { downloadLauncher, downloadState } from '#preload';
import { getErrorMessage, IPC_EVENT_DATA_TYPE, IpcRendererEventData, IpcRendererEventDataError } from '#shared';
import OutdatedIcon from '/@assets/outdated.svg';
import { Container } from './UpdateLauncher.styles';

enum AppState {
  Downloading = 'downloading',
  Downloaded = 'downloaded',
  Cancelled = 'cancelled',
}

const FIVE_SECONDS = 5000;

export const UpdateLauncher: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState | null>(null);
  const [retry, setRetry] = useState(0);

  const isDownloading = state === AppState.Downloading;

  const handleCancel = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const handleDownloadState = useCallback((_event: IpcRendererEvent, eventData: IpcRendererEventData) => {
    switch (eventData.type) {
      case IPC_EVENT_DATA_TYPE.START:
        setState(AppState.Downloading);
        console.log('Downloading');
        break;
      case IPC_EVENT_DATA_TYPE.COMPLETED: {
        setState(AppState.Downloaded);
        setRetry(0);
        console.log('Downloaded!!!');
        navigate('/update/success');
        break;
      }
      case IPC_EVENT_DATA_TYPE.CANCELLED: {
        setState(AppState.Cancelled);
        break;
      }
      case IPC_EVENT_DATA_TYPE.ERROR:
        log.error('[Renderer][UpdateLauncher][HandleDownloadState]', getErrorMessage((eventData as IpcRendererEventDataError).error));
        handleRetryDownload();
        break;
    }
  }, []);

  const handleDownload = useCallback(() => {
    downloadLauncher();
    downloadState(handleDownloadState);
  }, []);

  const handleRetryDownload = useCallback(
    (manualRetry: boolean = false) => {
      if (!manualRetry && retry >= 5) {
        return;
      }

      setRetry(retry + 1);
      setTimeout(() => {
        handleDownload();
      }, FIVE_SECONDS);
    },
    [retry],
  );

  return (
    <Container>
      <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" width="445px">
        <img src={OutdatedIcon} alt="Outdated Icon" height={56} width={56} />
        <Typography variant="h4" fontWeight={600} mt={2}>
          Update Needed
        </Typography>
        <Typography variant="h6" fontWeight={400} letterSpacing={0} lineHeight={1} mt={4}>
          You're using an outdated version of Decentraland.
          <br />
          Please download and install the latest version to continue.
          <br />
          <br />
          Uninstalling 'Decentraland Outdated' afterwards is recommended to ensure smooth performance.
        </Typography>
        <Box display="flex" mt={6} gap={2}>
          <Button
            variant="text"
            color="secondary"
            tabIndex={0}
            aria-label="Cancel update"
            sx={{ backgroundColor: '#00000066', color: '#FFFFFF !important', width: '190px', fontWeight: 700, fontSize: '14px' }}
            onClick={handleCancel}
          >
            CANCEL
          </Button>
          <Button
            variant="contained"
            tabIndex={1}
            aria-label="Download update"
            loading={isDownloading}
            onClick={handleDownload}
            sx={{ width: '190px', fontWeight: 700, fontSize: '14px' }}
          >
            DOWNLOAD
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
