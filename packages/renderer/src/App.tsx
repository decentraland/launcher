import React from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import { dark } from 'decentraland-ui2/dist/theme';
import { CssBaseline } from 'decentraland-ui2';
import { AppRoutes } from './Routes';

export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider theme={dark}>
        <CssBaseline />
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
};
