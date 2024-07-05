import {Grid, styled} from 'decentraland-ui2';

export const Tab = styled('div')(({theme}) => ({
  ...theme.components?.MuiTab,
  color: theme.palette.primary.dark,
}));

export const HeaderItem = styled(Grid)(() => ({
  display: 'flex',
  alignItems: 'center',
}));
