import path from 'node:path';
import { app } from 'electron';
import log from 'electron-log/main';
import { getOSName, PLATFORM } from '../helpers';

// Protocol Handler (deep link)
const PROTOCOL = 'decentraland';

async function handleProtocol(protocol: string | undefined) {
  if (protocol) {
    log.info('[Main Window][Protocol][handleProtocol] Protocol Handling', protocol);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).protocol = protocol;
  }
}

// Windows and Linux
app.on('second-instance', (_, argv) => {
  log.info('[Main Window][Protocol][second-instance] Second instance detected with argv:', argv);
  handleProtocol(argv.pop());
});

// MacOS
app.on('open-url', (_, url) => {
  log.info('[Main Window][Protocol][open-url] Open URL event received:', url);
  handleProtocol(url);
});

export function initProtocol() {
  log.info('[Main Window][Protocol] Initialize Protocol');
  if (import.meta.env.DEV && getOSName() === PLATFORM.WINDOWS) {
    // Register the private URI scheme differently for Windows when running a non-packaged version
    // https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  // Check for protocol in argv immediately if we're already ready
  if (process.argv.length > 0) {
    const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (url) {
      handleProtocol(url);
    }
  }
}
