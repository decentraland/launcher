import React, {useCallback} from 'react';
import {Link} from 'react-router-dom';
import {Grid, Tabs, Tab, Box, Button, IconButton, Divider} from 'decentraland-ui2';
import SettingsIcon from '@mui/icons-material/Settings';
import {HeaderItem} from './Header.styles';
import {useRouteMatch} from '/@/hooks/useRouteMatch';
import DCL_Logo from '/@assets/logo.svg';

export const Header: React.FC = () => {
  const routeMatch = useRouteMatch(['/', '/create']);
  const currentTab = routeMatch?.pattern?.path;

  return (
    <Box sx={{flexGrow: 1}}>
      <Grid
        container
        columnGap={'32px'}
        padding={'0 32px'}
      >
        <HeaderItem>
          <img
            src={DCL_Logo}
            alt="Decentraland Logo"
          />
        </HeaderItem>
        <HeaderItem xs>
          <Tabs
            value={currentTab}
            role="navigation"
          >
            <Tab
              label="Home"
              value="/"
              to="/"
              component={Link}
            />
            <Tab
              label="Create"
              value="/create"
              to="/create"
              component={Link}
            />
          </Tabs>
        </HeaderItem>
        <HeaderItem>
          <Button variant="outlined">Give us feedback</Button>
        </HeaderItem>
        <HeaderItem>
          <IconButton
            aria-label="settings"
            color="primary"
          >
            <SettingsIcon />
          </IconButton>
        </HeaderItem>
      </Grid>
      <Divider />
    </Box>
  );
};
