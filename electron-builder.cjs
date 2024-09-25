const config = {
  productName: 'Decentraland Launcher',
  artifactName: 'Decentraland Launcher-${os}-${arch}.${ext}',
  executableName: 'Decentraland Launcher',
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  files: ['packages/**/dist/**'],
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
    extendInfo: [
      {
        NSMicrophoneUsageDescription: 'Need microphone access to use voice chat in the application',
      },
    ],
    extraResources: ['icon.icns'],
  },
  dmg: {
    title: 'Decentraland Launcher Installer',
    background: 'buildResources/background.png',
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
};

module.exports = config;
