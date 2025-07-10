import React from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, dark } from 'decentraland-ui2/dist/theme';
import { AppRoutes } from './Routes';

export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider theme={dark}>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
};
