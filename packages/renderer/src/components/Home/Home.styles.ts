import {styled, Box} from 'decentraland-ui2';

export const VideoWrapper = styled('div')(_props => ({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: -1,
  '::after': {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    content: "''",
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

export const InfoMessage = styled(Box)(({theme}) => ({
  position: 'relative',
  padding: '32px',
  width: '390px',
  color: theme.palette.common.white,
  '::after': {
    position: 'absolute',
    top: 0,
    left: '-335px',
    paddingLeft: '335px',
    width: '100%',
    height: '100%',
    content: "''",
    zIndex: -1,
    background: 'linear-gradient(180deg, #C640CD 0%, #691FA9 100%)',
  },
  h1: {
    fontSize: '48px',
    fontWeight: 600,
    lineHeight: '56px',
    textAlign: 'left',
  },
  p: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '0.17px',
    textAlign: 'left',
  },
}));
