import { styled, Box, Card as DCLCard, CardContent as DCLCardContent } from 'decentraland-ui2';

export const Card = styled(DCLCard)({
  width: '385px',
  borderRadius: '24px',
});

export const CardContent = styled(DCLCardContent)({
  height: '225px',
  padding: '32px',
});

export const ImageContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '225px',
  padding: '28px',
  background: 'linear-gradient(116.91deg, #4A1975 0%, #A225AD 100%)',
  img: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
  },
});
