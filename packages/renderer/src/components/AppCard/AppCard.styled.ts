import {styled} from 'decentraland-ui2';

export const AppCardContainer = styled('div')(({theme}) => ({
  ...theme.components?.MuiCardContent,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '30px',
  color: theme.palette.common.white,
  padding: '35px 40px',
}));
