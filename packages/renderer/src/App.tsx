import React from 'react';
import {MemoryRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import {Box} from 'decentraland-ui2';
import {dark} from 'decentraland-ui2/dist/theme';
import {Header} from '/@/components/Header/Header';
import {Home} from '/@/components/Home/Home';
import {Create} from '/@/components/Create/Create';
import {Config} from '/@/components/Config/Config';

export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider theme={dark}>
        <Box id="app-container">
          <Router>
            <Header />
            <Routes>
              <Route
                path="/"
                element={<Home />}
              />
              <Route
                path="/create"
                element={<Create />}
              />
              <Route
                path="/config"
                element={<Config />}
              />
            </Routes>
          </Router>
        </Box>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
