import path from 'node:path';
import { app } from 'electron';
import log from 'electron-log/main';
import { getOSName, PLATFORM } from '../helpers';

// Protocol Handler (deep link)
const PROTOCOL = 'decentraland';

export function initProtocol() {
  if (import.meta.env.DEV && getOSName() === PLATFORM.WINDOWS) {
    // Register the private URI scheme differently for Windows when running a non-packaged version
    // https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  async function handleProtocol(protocol: string | undefined) {
    if (protocol) {
      log.info('[Main Window] Protocol Handling', protocol);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).protocol = protocol;
    }
  }

  app.whenReady().then(() => {
    if (process.argv.length >= 2) {
      const url = process.argv.slice(1).find(arg => arg.startsWith(`${PROTOCOL}://`));
      if (url) {
        handleProtocol(url);
      }
    }
  });

  // Windows and Linux
  app.on('second-instance', (_, argv) => {
    handleProtocol(argv.pop());
  });

  // MacOS
  app.on('open-url', (_, url) => {
    handleProtocol(url);
  });
}
