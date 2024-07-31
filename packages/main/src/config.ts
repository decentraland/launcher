import fs from 'fs';
import { join } from 'path';
import { app } from 'electron';

interface Config {
  [key: string]: unknown;
}

export class ConfigManager {
  private configPath: string;

  constructor(configFileName: string = 'config.json') {
    const configPath = join(app.getPath('appData'), configFileName);
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify({}));
    }
    this.configPath = configPath;
  }

  readConfig(): Config {
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config file:', error);
      return {};
    }
  }

  writeConfig(config: Config): void {
    try {
      const data = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configPath, data, 'utf-8');
    } catch (error) {
      console.error('Error writing config file:', error);
    }
  }

  get(key: string) {
    const config = this.readConfig();
    return config[key];
  }

  set(key: string, value: unknown) {
    const config = this.readConfig();
    config[key] = value;
    this.writeConfig(config);
  }
}
