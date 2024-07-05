import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, Button, Typography} from 'decentraland-ui2';
import {platform, downloadApp} from '#preload';
import {APPS, PLATFORMS, Props} from './types';
import {AppCardContainer} from './AppCard.styled';

export const AppCard: React.FC<Props> = ({app}: Props) => {
  const navigate = useNavigate();
  const appsLink = useRef<Map<keyof typeof APPS, string>>(new Map());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`https://api.github.com/repos/decentraland/${APPS[app]}/releases/latest`).then(
      async resp => {
        if (resp.status === 200) {
          const data = await resp.json();
          const asset = data.assets.find((asset: Record<string, string>) =>
            asset.name.includes(PLATFORMS[platform].toLowerCase()),
          );
          if (asset) {
            console.log('Found the asset for your platform', {asset});
            appsLink.current.set(app, asset.browser_download_url);
          } else {
            console.log(data.assets);
          }
        } else {
          console.error('Failed to fetch latest release', JSON.stringify(resp));
        }
      },
    );
  }, [appsLink]);

  const handleDownloadedApp = useCallback((error: any) => {
    if (error) {
      console.error(error);
    } else {
      console.log('[AppCard] Download finished');
    }
  }, []);

  const handleDownloadApp = useCallback(async () => {
    const url = appsLink.current.get(app);
    if (url) {
      console.log('[AppCard] Downloading', url);
      setDownloading(true);
      const resp = await downloadApp(url);
      if (!!resp) {
        console.log('[AppCard] Downloaded', {resp});
      } else {
        console.log('[AppCard] Error downloading');
      }
      setDownloading(false);
    }
  }, [appsLink, setDownloading, handleDownloadedApp]);

  return (
    <Card>
      <AppCardContainer>
        <Typography
          variant="h6"
          onClick={() => navigate(`/${app.toString().toLowerCase()}`)}
        >
          {app}
        </Typography>
        <Button
          variant="contained"
          onClick={handleDownloadApp}
        >
          Download
        </Button>
        {downloading ? <p>Downloading...</p> : null}
      </AppCardContainer>
    </Card>
  );
};
