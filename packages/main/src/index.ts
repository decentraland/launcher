import { app } from 'electron';
import updater from 'electron-updater';
import log from 'electron-log/main';
import * as Sentry from '@sentry/electron/main';
import { Analytics, ANALYTICS_EVENT, getErrorMessage } from '#shared';
import { getUserId } from './modules/config';
import { initIpcHandlers } from './modules/ipc';
import { initProtocol } from './modules/protocol';
import { restoreOrCreateWindow } from './mainWindow';
import { getAppVersion, getOSName, PLATFORM } from './helpers';
import './security-restrictions';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
});

// Initialize logger
log.transports.file.setAppName('DecentralandLauncher');
log.initialize();

const analytics = new Analytics(getUserId(), getOSName(), getAppVersion());

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
  .then(() => {
    analytics.track(ANALYTICS_EVENT.LAUNCHER_OPEN, { version: getAppVersion() });

    initProtocol();
    initIpcHandlers();

    restoreOrCreateWindow();
  })
  .catch(e => console.error('Failed create window:', e));

// Handle analytics tracking on quit
app.on('before-quit', async () => {
  await analytics.track(ANALYTICS_EVENT.LAUNCHER_CLOSE, { version: getAppVersion() });
  await analytics.closeAndFlush();
});
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
    updater.autoUpdater.autoInstallOnAppQuit = true;
    updater.autoUpdater.autoRunAppAfterInstall = false;
    let version = '';

    updater.autoUpdater.on('checking-for-update', () => {
      log.info('[Main Window][AutoUpdater] Checking for updates');
      analytics.track(ANALYTICS_EVENT.LAUNCHER_UPDATE_CHECKING);
    });

    updater.autoUpdater.on('update-available', info => {
      version = info.version;
      log.info('[Main Window][AutoUpdater] Update available', version);
      analytics.track(ANALYTICS_EVENT.LAUNCHER_UPDATE_AVAILABLE, { version });
    });

    updater.autoUpdater.on('update-cancelled', info => {
      log.info('[Main Window][AutoUpdater] Update cancelled', info.version);
      analytics.track(ANALYTICS_EVENT.LAUNCHER_UPDATE_CANCELLED, { version: info.version });
      Sentry.captureMessage('Auto-update was cancelled', {
        level: 'info',
        extra: {
          updateInfo: info,
        },
      });
    });

    updater.autoUpdater.on('update-not-available', _info => {
      log.info('[Main Window][AutoUpdater] Update not available');
      analytics.track(ANALYTICS_EVENT.LAUNCHER_UPDATE_NOT_AVAILABLE);
      app.quit();
    });

    updater.autoUpdater.once('download-progress', _info => {
      log.info('[Main Window][AutoUpdater] Downloading update');
    });

    updater.autoUpdater.on('update-downloaded', info => {
      log.info('[Main Window][AutoUpdater] Update downloaded', info.version);
      analytics.track(ANALYTICS_EVENT.LAUNCHER_UPDATE_DOWNLOADED, { version: info.version });
      const silent = getOSName() === PLATFORM.WINDOWS;
      updater.autoUpdater.quitAndInstall(silent, false);
    });

    updater.autoUpdater.on('error', err => {
      log.error('[Main Window][AutoUpdater] Error in auto-updater', getErrorMessage(err));
      analytics.track(ANALYTICS_EVENT.LAUNCHER_UPDATE_ERROR, { version: version, error: getErrorMessage(err) });
      Sentry.captureException(err);

      app.quit();
    });

    updater.autoUpdater.checkForUpdates();
  } else {
    app.quit();
  }
}
