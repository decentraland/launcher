import { RendererLogger } from 'electron-log';
import log from 'electron-log/renderer';

export function getLogger(): RendererLogger {
  log.transports.console.format = '[Renderer] {text}';
  return log;
}
