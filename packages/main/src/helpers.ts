import { dirname, join } from 'path';
import fs from 'fs';
import { app } from 'electron';
import JSZip from 'jszip';

export enum PLATFORM {
  MAC = 'mac',
  LINUX = 'linux',
  WINDOWS = 'windows',
  UNSUPPORTED = 'unsupported',
}

export function getOSName(): PLATFORM {
  switch (process.platform) {
    case 'darwin':
      return PLATFORM.MAC;
    case 'linux':
      return PLATFORM.LINUX;
    case 'win32':
      return PLATFORM.WINDOWS;
    default:
      return PLATFORM.UNSUPPORTED;
  }
}

export function getAppBasePath(): string {
  const osName = getOSName();
  if (![PLATFORM.MAC, PLATFORM.WINDOWS].includes(osName)) {
    throw new Error('Unsupported OS');
  }

  if (process.env.RUN_ENV === 'development') return './';

  const applicationFolderName = 'DecentralandLauncher';

  return osName === PLATFORM.WINDOWS ? dirname(app.getPath('exe')) : join(app.getPath('appData'), applicationFolderName);
}

export function getAppIcon(): string {
  const osName = getOSName();
  if (![PLATFORM.MAC, PLATFORM.WINDOWS].includes(osName)) {
    throw new Error('Unsupported OS');
  }

  const appResourcesPath = join(dirname(app.getPath('exe')), 'resources');

  return osName === PLATFORM.WINDOWS ? join(appResourcesPath, 'icon.ico') : join(appResourcesPath, 'icon.icns');
}

function ensureDirSync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export async function decompressFile(sourcePath: string, destinationPath: string) {
  try {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }

    // Read the ZIP file
    const data = fs.readFileSync(sourcePath);
    const zip = await JSZip.loadAsync(data);

    // Ensure the destination directory exists
    ensureDirSync(destinationPath);

    // Extract all files
    for (const [relativePath, file] of Object.entries(zip.files)) {
      const outputPath = join(destinationPath, relativePath);

      ensureDirSync(dirname(outputPath));

      if (file.dir) {
        ensureDirSync(outputPath);
      } else {
        const content = await file.async('nodebuffer');
        fs.writeFileSync(outputPath, content);
      }
    }
  } catch (error) {
    throw new Error('Failed to decompress file with error: ' + JSON.stringify(error));
  }
}

export function isAppInstalled(appPath: string): boolean {
  if (!fs.existsSync(appPath)) {
    return false;
  }

  if (!fs.existsSync(join(appPath, 'version.json'))) {
    return false;
  }

  return true;
}

export function isAppUpdated(appPath: string, version: string): boolean {
  if (!isAppInstalled(appPath)) {
    return false;
  }

  const versionFile = join(appPath, 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  return versionData.version === version;
}
