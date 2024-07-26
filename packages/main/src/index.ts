import { app } from 'electron';
import updater from 'electron-updater';
import log from 'electron-log/main';
import { restoreOrCreateWindow } from '/@/mainWindow';
import './security-restrictions';

// Initialize logger
log.transports.file.setAppName('DecentralandLauncher');
log.initialize();

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  updateAppAndQuit();
});

/**
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on('activate', restoreOrCreateWindow);

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(restoreOrCreateWindow)
  .catch(e => console.error('Failed create window:', e));

/**
 * Check for app updates, install it in background and notify user that new version was installed.
 * No reason run this in non-production build.
 * @see https://www.electron.build/auto-update.html#quick-setup-guide
 *
 * Note: It may throw "ENOENT: no such file app-update.yml"
 * if you compile production app without publishing it to distribution server.
 * Like `npm run compile` does. It's ok 😅
 */
function updateAppAndQuit() {
  if (import.meta.env.PROD) {
    updater.autoUpdater.autoRunAppAfterInstall = false;
    updater.autoUpdater.on('checking-for-update', () => {
      log.info('[Main Window][AutoUpdater] Checking for updates');
    });
    updater.autoUpdater.on('update-available', _info => {
      log.info('[Main Window][AutoUpdater] Update available');
    });
    updater.autoUpdater.on('update-not-available', _info => {
      log.info('[Main Window][AutoUpdater] Update not available');
      app.quit();
    });
    updater.autoUpdater.on('update-downloaded', _info => {
      log.info('[Main Window][AutoUpdater] Update downloaded');
      updater.autoUpdater.quitAndInstall(true, false);
    });
    updater.autoUpdater.on('error', err => {
      log.error('[Main Window][AutoUpdater] Error in auto-updater', err);
      app.quit();
    });
    updater.autoUpdater.checkForUpdates();
  } else {
    app.quit();
  }
}
