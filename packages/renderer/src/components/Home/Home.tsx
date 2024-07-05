// import {net} from 'electron';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Box, Button} from 'decentraland-ui2';
import {platform, downloadApp, openApp, isExplorerInstalled} from '#preload';
import Create_IMG from '/@assets/create.svg';
import VideoHomeLandscape from '/@assets/home-landscape.mp4';
import {VideoWrapper, InfoMessage} from './Home.styles';

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

const DownloadClientButton = () => {
  const appsLink = useRef<Map<APPS, string>>(new Map());
  const [isInstalled, setIsInstalled] = useState<boolean | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`https://api.github.com/repos/decentraland/${APPS.Explorer}/releases/latest`).then(
      async resp => {
        if (resp.status === 200) {
          const data = await resp.json();
          const asset = data.assets.find((asset: Record<string, string>) =>
            asset.name.includes(PLATFORMS[platform].toLowerCase()),
          );
          if (asset) {
            console.log('Found the asset for your platform', {asset});
            appsLink.current.set(APPS.Explorer, asset.browser_download_url);
          } else {
            console.log('No luck finding the asset for your platform');
            console.log(data.assets);
          }
        } else {
          console.error('Failed to fetch latest release', JSON.stringify(resp));
        }
      },
    );
  }, []);

  useEffect(() => {
    isExplorerInstalled().then(setIsInstalled);
  }, []);

  console.log('explorer installed: ', isInstalled);

  const handleClick = useCallback(() => {
    if (isInstalled) {
      openApp(APPS.Explorer);
    } else {
      if (appsLink.current?.get(APPS.Explorer)) {
        downloadApp(appsLink.current.get(APPS.Explorer)!).then(() => {
          setIsInstalled(true);
        });
      }
    }
  }, [isInstalled]);

  return (
    <Button
      variant={'contained'}
      onClick={handleClick}
    >
      {isInstalled ? 'Jump In' : 'Download'}
    </Button>
  );
};

export const Home: React.FC = () => {
  return (
    <Box
      display={'flex'}
      justifyContent={'center'}
    >
      <VideoWrapper>
        <video
          autoPlay
          muted
          loop
          src={VideoHomeLandscape}
        />
      </VideoWrapper>
      <Box
        display={'flex'}
        justifyContent={'center'}
      >
        <Box
          display={'flex'}
          alignItems={'center'}
        >
          <img src={Create_IMG} />
          <InfoMessage>
            <h1>New Client Alpha</h1>
            <p>
              The alpha version of Decentraland's game-changing Desktop Client 2.0 was unveiled at
              the Community Summit, featuring stunning visuals, seamless performance, and enhanced
              immersion set to revolutionize the DCL experience.
            </p>
            <DownloadClientButton />
          </InfoMessage>
        </Box>
      </Box>
    </Box>
  );
};
