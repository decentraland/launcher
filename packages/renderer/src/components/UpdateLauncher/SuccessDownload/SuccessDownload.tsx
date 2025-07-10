import React, { useEffect, useState } from 'react';
import { Box, Typography } from 'decentraland-ui2';
import { getOSName } from '#preload';
import { PLATFORM } from '#shared';
import APPLE_LOGO from '/@assets/apple-logo.svg';
import WINDOWS_LOGO from '/@assets/windows-logo.svg';
import INSTALLATION_MAC_IMG from '/@assets/installation-mac.png';
import UNINSTALL_MAC_IMG from '/@assets/uninstall-mac.png';
import WINDOWS_INSTALLATION_IMG from '/@assets/installation-windows.png';
import WINDOWS_UNINSTALL_IMG from '/@assets/uninstall-windows.png';
import { Container } from '../UpdateLauncher.styles';
import { Card, CardContent, ImageContainer } from './SuccessDownload.styles';

const CONTENT: Record<
  PLATFORM.MAC | PLATFORM.WINDOWS,
  {
    logo: string;
    title: string;
    install_section: {
      title: string;
      description: React.ReactNode[];
      image: string;
    };
    uninstall_section: {
      title: string;
      description: React.ReactNode[];
      image: string;
    };
  }
> = {
  [PLATFORM.MAC]: {
    logo: APPLE_LOGO,
    title: "You're almost one!",
    install_section: {
      title: 'Install New Version',
      description: [
        'Open the new ',
        <strong style={{ color: '#FFFFFF' }}>Decentraland</strong>,
        ' file in your ',
        <strong style={{ color: '#FFFFFF' }}>Downloads folder</strong>,
        '. Next, drag and drop it to your ',
        <strong style={{ color: '#FFFFFF' }}>Applications folder</strong>,
        '. Finally, locate Decentraland in your Applications folder and click on it to install.',
      ],
      image: INSTALLATION_MAC_IMG,
    },
    uninstall_section: {
      title: 'Uninstall Old Version',
      description: [
        'Locate ',
        <strong style={{ color: '#FFFFFF' }}>'Decentraland Outdated'</strong>,
        ' in your ',
        <strong style={{ color: '#FFFFFF' }}>Applications folder</strong>,
        ' and and select ',
        <strong style={{ color: '#FFFFFF' }}>'Move to Trash'</strong>,
        ' to uninstall.',
      ],
      image: UNINSTALL_MAC_IMG,
    },
  },
  [PLATFORM.WINDOWS]: {
    logo: WINDOWS_LOGO,
    title: "You're almost one!",
    install_section: {
      title: 'Install New Version',
      description: [
        'Open the new ',
        <strong style={{ color: '#FFFFFF' }}>Decentraland</strong>,
        ' file in your Downloads folder and ',
        <strong style={{ color: '#FFFFFF' }}>follow the Setup Wizard's instructions</strong>,
        ' to install Decentraland.',
      ],
      image: WINDOWS_INSTALLATION_IMG,
    },
    uninstall_section: {
      title: 'Uninstall Old Version',
      description: [
        'Navigate to ',
        <strong style={{ color: '#FFFFFF' }}>'Add or remove programs'</strong>,
        ' on your computer, locate ',
        <strong style={{ color: '#FFFFFF' }}>'Decentraland Outdated'</strong>,
        ' and select ',
        <strong style={{ color: '#FFFFFF' }}>'Uninstall'</strong>,
        '.',
      ],
      image: WINDOWS_UNINSTALL_IMG,
    },
  },
};

export const SuccessDownload: React.FC = () => {
  const [osName, setOsName] = useState<PLATFORM.MAC | PLATFORM.WINDOWS | null>(null);

  useEffect(() => {
    async function checkOS() {
      const osName = await getOSName();
      if (osName === PLATFORM.MAC || osName === PLATFORM.WINDOWS) {
        setOsName(osName);
      }
    }
    checkOS();
  }, []);

  if (!osName) return null;

  return (
    <Container>
      <Box display="flex" flexDirection="column" gap={8}>
        <Box display="flex" alignItems="center" flexDirection="column">
          <img src={CONTENT[osName].logo} alt="apple logo" height={36} width={36} />
          <Typography variant="h2" fontWeight={600} fontSize={36} mt={2}>
            {CONTENT[osName].title}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={8}>
          <Card>
            <CardContent>
              <Typography variant="h2" fontWeight={600} fontSize={'24px'}>
                <span style={{ color: '#FFA25A' }}>1</span> {CONTENT[osName].install_section.title}
              </Typography>
              <Typography variant="h6" fontWeight={600} fontSize={'16px'} mt={1} color="#FFFFFFB2">
                {CONTENT[osName].install_section.description}
              </Typography>
            </CardContent>
            <ImageContainer>
              <img src={CONTENT[osName].install_section.image} alt={`${osName} installation screenshot`} />
            </ImageContainer>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h2" fontWeight={600} fontSize={'24px'}>
                <span style={{ color: '#FFA25A' }}>2</span> {CONTENT[osName].uninstall_section.title}
              </Typography>
              <Typography variant="h6" fontWeight={600} fontSize={'16px'} mt={1} color="#FFFFFFB2">
                {CONTENT[osName].uninstall_section.description}
              </Typography>
            </CardContent>
            <ImageContainer>
              <img src={CONTENT[osName].uninstall_section.image} alt={`${osName} uninstall screenshot`} />
            </ImageContainer>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};
