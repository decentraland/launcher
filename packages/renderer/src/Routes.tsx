import React, { useCallback } from 'react';
import { Route, Routes, Await } from 'react-router';
import { getArch, getOSName } from '#preload';
import { PLATFORM } from '#shared';
import { Home } from './components/Home/Home';
import { SuccessDownload } from './components/UpdateLauncher/SuccessDownload/SuccessDownload';
import { UpdateLauncher } from './components/UpdateLauncher/UpdateLauncher';

async function getPlatformData() {
  const osName = await getOSName();
  const arch = await getArch();
  return { osName, arch };
}

export const AppRoutes = () => {
  const getDefaultComponent = useCallback(() => {
    return (
      <React.Suspense fallback={<div></div>}>
        <Await resolve={getPlatformData()}>
          {({ osName, arch }) => {
            if (osName === PLATFORM.MAC && arch === 'x64') {
              return <Home />;
            } else {
              return <UpdateLauncher />;
            }
          }}
        </Await>
      </React.Suspense>
    );
  }, []);

  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/update">
        <Route path="success" element={<SuccessDownload />} />
        <Route path="*" element={<UpdateLauncher />} />
      </Route>
      <Route path="*" element={getDefaultComponent()} />
    </Routes>
  );
};
