import { dirname, join } from 'node:path';
import fs from 'node:fs';
import stream from 'node:stream';
import { app } from 'electron';
import JSZip from 'jszip';
import { extract, list } from 'tar';
import semver from 'semver';
import { PLATFORM } from '#shared';

const DEFAULT_PROVIDER = 'dcl';

export function getAppVersion(): string {
  return app.getVersion();
}

export function getPlatform() {
  return process.platform;
}

export function getOSName(): PLATFORM {
  switch (getPlatform()) {
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

export function getArch() {
  return process.arch;
}

export function getAppBasePath(): string {
  const osName = getOSName();
  if (![PLATFORM.MAC, PLATFORM.WINDOWS].includes(osName)) {
    throw new Error('Unsupported OS');
  }

  const applicationFolderName = 'DecentralandLauncher';

  return osName === PLATFORM.WINDOWS ? dirname(app.getPath('exe')) : join(app.getPath('appData'), applicationFolderName);
}

export function getDownloadsPath(): string {
  return join(app.getPath('downloads'));
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
      let strip = 0;
      // TODO: Remove this list step when the compressing process removes the folder
      await new Promise((resolve, reject) => {
        const inspectionStream = new stream.PassThrough();
        inspectionStream.end(tarFileData);

        inspectionStream
          .pipe(
            list({
              cwd: destinationPath,
              onReadEntry: entry => {
                if (entry.path.endsWith('Decentraland.app/')) {
                  const parts = entry.path.split('/');
                  strip = parts.length - 2;
                }
                entry.resume();
              },
            }),
          )
          .on('end', resolve)
          .on('error', reject);
      });

      await new Promise((resolve, reject) => {
        const extractionStream = new stream.PassThrough();
        extractionStream.end(tarFileData);
        extractionStream
          .pipe(
            extract({
              cwd: destinationPath,
              strip: strip,
            }),
          )
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

export function isAppUpdated(appPath: string, version: string): boolean {
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

export function getProvider() {
  return import.meta.env.VITE_PROVIDER || DEFAULT_PROVIDER;
}
