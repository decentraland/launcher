import {dirname, join} from 'path';
import fs from 'fs';
import {app} from 'electron';
import JSZip from 'jszip';

export function getAppBasePath(): string {
  if (!process.platform || !['win32', 'darwin'].includes(process.platform)) {
    console.error(`Unsupported OS: ${process.platform}`);
    throw new Error('Unsupported OS');
  }

  if (process.env.RUN_ENV === 'development') return './';

  const applicationFolderName = 'DecentralandLauncher';

  return join(app.getPath('appData'), applicationFolderName);
}

function ensureDirSync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true});
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
      console.log('Path: ', dirname(outputPath));
      ensureDirSync(dirname(outputPath));

      if (file.dir) {
        ensureDirSync(outputPath);
      } else {
        const content = await file.async('nodebuffer');
        fs.writeFileSync(outputPath, content);
      }
    }

    console.log('File decompressed successfully');
  } catch (error) {
    console.error('Failed to decompress file:', error);
  }
}

export enum PLATFORM {
  MAC = 'mac',
  LINUX = 'linux',
  WINDOWS = 'windows',
}

export function getOSName(): string | null {
  switch (process.platform) {
    case 'darwin':
      return PLATFORM.MAC;
    case 'linux':
      return PLATFORM.LINUX;
    case 'win32':
      return PLATFORM.WINDOWS;
    default:
      return null;
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
