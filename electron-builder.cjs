/** @type {import('electron-builder').Configuration} */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = {
  productName: 'Decentraland Outdated',
  artifactName: 'Decentraland Outdated-${os}-${arch}.${ext}',
  executableName: 'Decentraland Outdated',
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  files: [
    'packages/**/dist/**',
    'package.json',
    'node_modules/**/*',
    '!node_modules/.bin/**',
    '!**/*.{map,md,markdown,txt}',
    '!**/{test,tests,example,examples,docs,doc}/**',
    '!**/{.DS_Store,LICENSE,license,README,CHANGELOG}*',
    '!node_modules/*/{test,tests,example,examples,docs,doc}/**',
    '!node_modules/**/*.{md,markdown,html,txt}',
    '!node_modules/**/*.d.ts',
    '!node_modules/**/*.map',
    '!node_modules/**/LICENSE*',
    '!node_modules/**/license*',
    '!node_modules/**/CHANGELOG*',
    '!node_modules/**/README*',
    '!node_modules/**/.DS_Store',
    '!node_modules/@types/**',
    '!node_modules/typescript/**',
    '!node_modules/eslint*/**',
    '!node_modules/@typescript-eslint/**',
    '!node_modules/prettier/**',
    '!node_modules/jest/**',
    '!node_modules/@jest/**',
    '!node_modules/ts-jest/**',
    '!node_modules/vitest/**',
    '!node_modules/happy-dom/**',
    '!node_modules/playwright/**',
    '!node_modules/electron/**',
    '!node_modules/electron-builder/**',
    '!node_modules/app-builder-*/**',
    '!node_modules/@sentry/wizard/**',
    '!node_modules/@babel/**/**',
    '!node_modules/@mui/**/**',
    '!node_modules/react-dom/**/**',
    '!node_modules/decentraland-ui2/**/**',
    '!node_modules/date-fns/**/**',
    '!node_modules/caniuse-lite/**/**',
    '!node_modules/@emotion/**/**',
    '!node_modules/@sentry/cli-*/**',
    '!node_modules/@sentry/react/**',
  ],
  compression: 'store',
  win: {
    publisherName: 'Decentraland Foundation',
    appId: 'Decentraland.Launcher',
    icon: 'buildResources/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    verifyUpdateCodeSignature: false,
    signAndEditExecutable: true,
    signingHashAlgorithms: ['sha256'],
    rfc3161TimeStampServer: 'http://ts.ssl.com',
    timeStampServer: 'http://ts.ssl.com',
    extraResources: ['buildResources/icon.ico'],
  },
  nsis: {
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    oneClick: false,
    perMachine: true,
    deleteAppDataOnUninstall: true,
    include: 'buildResources/scripts/windowsInstaller.nsh',
    installerSidebar: 'buildResources/background.bmp',
    installerIcon: 'buildResources/icon.ico',
  },
  mac: {
    appId: 'com.Decentraland.Launcher',
    icon: 'buildResources/icon.icns',
    target: [
      {
        target: 'default',
        arch: ['x64', 'arm64'],
      },
    ],
    hardenedRuntime: true,
    entitlements: 'buildResources/entitlements.mac.plist',
    extendInfo: 'buildResources/Info.plist',
    extraResources: ['icon.icns'],
  },
  dmg: {
    title: 'Decentraland Outdated Launcher Installer',
    background: 'buildResources/background.png',
    format: 'UDZO',
    window: {
      width: 714,
      height: 472,
    },
    contents: [
      {
        x: 230,
        y: 215,
        type: 'file',
      },
      {
        x: 460,
        y: 215,
        type: 'link',
        path: '/Applications',
      },
    ],
  },
  publish: [
    {
      provider: 'github',
      vPrefixedTagName: false,
    },
  ],
  protocols: [
    {
      name: 'decentraland',
      schemes: ['decentraland'],
    },
  ],
  afterPack: async context => {
    if (process.platform === 'darwin' && process.env.MODE === 'production') {
      const { appOutDir, packager } = context;
      const appName = packager.appInfo.productFilename;
      const appPath = path.join(appOutDir, `${appName}.app/Contents/MacOS/${appName}`);

      console.log('⚙️ Stripping debug symbols...');
      execSync(`strip "${appPath}"`);
      console.log('✅ Debug symbols removed.');
    }
  },
  artifactBuildCompleted: async buildResult => {
    if (process.platform === 'darwin' && process.env.MODE === 'production') {
      const { file } = buildResult;

      if (file && file.endsWith('.dmg')) {
        const dmgPath = file;
        console.log(`🗜️ Compressing DMG file: ${dmgPath}`);
        const compressedPath = `${dmgPath.slice(0, -4)}-compressed.dmg`;
        execSync(`hdiutil convert "${dmgPath}" -format UDBZ -imagekey zlib-level=9 -o "${compressedPath}"`);

        const beforeSize = execSync(`du -sh "${dmgPath}"`).toString().trim();
        const afterSize = execSync(`du -sh "${compressedPath}"`).toString().trim();
        console.log(`✅ Size reduction: ${beforeSize} → ${afterSize}`);

        fs.renameSync(compressedPath, dmgPath);
      }
    }
    return true;
  },
};

// Sign Windows .exe
if (process.env.CODE_SIGN_SCRIPT_PATH) {
  config.win.sign = configuration => {
    console.log('Requested signing for ', configuration.path);

    // Only proceed if the installer .exe file is in the configuration path - skip signing everything else
    if (!configuration.path.endsWith('Decentraland Outdated-win-x64.exe')) {
      console.log('This is not the installer .exe, skip signing');
      return true;
    }

    const scriptPath = process.env.CODE_SIGN_SCRIPT_PATH;

    try {
      // Execute the sign script synchronously
      process.env.INPUT_COMMAND = 'sign'; // override the INPUT_COMMAND, it is already set in the "env" of the GitHub Action step, but for some reason it gets overwritten with 'npx electron-builder ...' so we must set it to 'sign'
      process.env.INPUT_FILE_PATH = configuration.path; // set the file path to the installer .exe
      const env = {
        command: process.env.INPUT_COMMAND,
        username: process.env.INPUT_USERNAME,
        password: process.env.INPUT_PASSWORD,
        credential_id: process.env.INPUT_CREDENTIAL_ID,
        totp_secret: process.env.INPUT_TOTP_SECRET,
        file_path: process.env.INPUT_FILE_PATH,
        output_path: process.env.INPUT_OUTPUT_PATH,
        malware_block: process.env.INPUT_MALWARE_BLOCK,
        override: process.env.INPUT_OVERRIDE,
        clean_logs: process.env.INPUT_CLEAN_LOGS,
        environment_name: process.env.INPUT_ENVIRONMENT_NAME,
        jvm_max_memory: process.env.INPUT_JVM_MAX_MEMORY,
      };
      console.log('env:', JSON.stringify(env, null, 2));
      const output = execSync(`node "${scriptPath}"`, {
        env: { ...process.env, ...env },
      }).toString();
      console.log(`Script output: ${output}`);
    } catch (error) {
      console.error(`Error executing script: ${error.message}`);
      if (error.stdout) {
        console.log(`Script stdout: ${error.stdout.toString()}`);
      }
      if (error.stderr) {
        console.error(`Script stderr: ${error.stderr.toString()}`);
      }
      return false;
    }

    return true; // Return true at the end of successful signing
  };

  // sign only for Windows 10 and above - adjust for your code as needed
  config.win.signingHashAlgorithms = ['sha256'];
}

module.exports = config;
