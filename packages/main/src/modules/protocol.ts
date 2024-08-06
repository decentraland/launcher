import { app } from 'electron';
import log from 'electron-log/main';
import { getOSName, PLATFORM } from '../helpers';

// Protocol Handler (deep link)
const PROTOCOL = 'decentraland';

export function initProtocol() {
  if (getOSName() === PLATFORM.WINDOWS) {
    // Register the private URI scheme differently for Windows
    // https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [app.getAppPath()]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  async function handleProtocol(protocol: string | undefined) {
    if (protocol) {
      try {
        log.info('[Main Window] Protocol Handling', protocol);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).protocol = protocol;
      } catch (error) {
        log.error('[Main Window] Protocol Handling Error', error);
      }
    }
  }

  // Windows and Linux
  app.on('second-instance', (_, argv) => {
    handleProtocol(argv.pop());
  });

  // MacOS
  app.on('open-url', (_, url) => {
    handleProtocol(url);
  });
}
