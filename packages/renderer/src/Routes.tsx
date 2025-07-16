import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { getArch, getOSName } from '#preload';
import { PLATFORM } from '#shared';
import { Home } from './components/Home/Home';
import { SuccessDownload } from './components/UpdateLauncher/SuccessDownload/SuccessDownload';
import { UpdateLauncher } from './components/UpdateLauncher/UpdateLauncher';

export const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkPlatform() {
      const osName = await getOSName();
      const arch = await getArch();

      if (osName === PLATFORM.MAC && arch === 'x64') {
        return navigate('/home');
      }
    }
    checkPlatform();
  }, []);

  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/update">
        <Route path="success" element={<SuccessDownload />} />
        <Route path="*" element={<UpdateLauncher />} />
      </Route>
      <Route path="*" element={<UpdateLauncher />} />
    </Routes>
  );
};
