import { dirname, join } from 'node:path';
import fs from 'node:fs';
import stream from 'node:stream';
import { app } from 'electron';
import JSZip from 'jszip';
import { extract } from 'tar';
import semver from 'semver';

export function getAppVersion(): string {
  return app.getVersion();
}

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

    // Ensure the destination directory exists
    ensureDirSync(destinationPath);

    // Read the ZIP file
    const data = fs.readFileSync(sourcePath);
    const zip = await JSZip.loadAsync(data);

    const tarFile = Object.values(zip.files).find(file => file.name.endsWith('.tar'));

    if (tarFile) {
      // Extract .tar files
      const tarFileData = await tarFile.async('nodebuffer');
      // Create a readable stream from the buffer
      const tarFileStream = new stream.PassThrough();
      tarFileStream.end(tarFileData);
      await new Promise((resolve, reject) => {
        tarFileStream
          .pipe(extract({ cwd: destinationPath }))
          .on('error', reject)
          .on('end', resolve);
      });
    } else {
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
    }
  } catch (error) {
    throw new Error('Failed to decompress file with error: ' + JSON.stringify(error));
  }
}

export function isAppInstalled(appPath: string, version: string): boolean {
  if (!fs.existsSync(appPath)) {
    return false;
  }

  if (!fs.existsSync(join(appPath, 'version.json'))) {
    return false;
  }

  const versionFile = join(appPath, 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  return versionData[version] !== undefined;
}

export function isAppUpdated(appPath: string, version: string): boolean {
  if (!isAppInstalled(appPath, version)) {
    return false;
  }

  const versionFile = join(appPath, 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  return versionData.version === version;
}

/**
 * Extracts additional arguments from process.argv.
 *
 * @returns {string[]} An array of additional arguments that match specific patterns.
 */
export function getAdditionalArguments(): string[] {
  const args = [];

  if (process.argv.length > 0) {
    for (let i = 0; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (/--(version|prerelease|dev|downloadedfilepath)/.test(arg)) {
        args.push(arg);
      }
    }
  }

  return args;
}

export function compareVersions(version1: string, version2: string) {
  const result = semver.compare(version1, version2);
  return result > 0;
}
