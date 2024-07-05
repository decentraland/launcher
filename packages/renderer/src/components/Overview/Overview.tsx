// import {net} from 'electron';
import React from 'react';
import {Grid} from 'decentraland-ui2';
import {AppCard} from '../AppCard/AppCard';
import {APPS} from '../AppCard/types';

export const Overview: React.FC = () => {
  const [selectedApp, setSelectedApp] = React.useState<string>('');
  const apps = Object.keys(APPS) as Array<keyof typeof APPS>;

  return (
    <Grid
      container
      spacing={2}
    >
      {apps.map((app, index) => (
        <Grid
          item
          xs={12 / apps.length}
          key={index}
        >
          <AppCard app={app} />
        </Grid>
      ))}
    </Grid>
  );
};
