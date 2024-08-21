import { net } from 'electron';
import log from 'electron-log/main';

export async function getIpAddress() {
  try {
    const response = await net.fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    log.error('Failed to get IP address:', error);
    return undefined;
  }
}
