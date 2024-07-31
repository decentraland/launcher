# Decentraland Launcher

Decentraland Launcher is an Electron-based application designed to download and install the latest Decentraland Client. This application is distributed for both Windows and MacOS, supporting both x64 and ARM architectures.

This project is based on the [vite-electron-builder](https://github.com/cawa-93/vite-electron-builder) template.

## Getting Started

### Installation

First, install the dependencies

```sh
npm install
```

### Running the Application

To start the application in development mode, run:

```sh
npm start
```

This will start both the Vite development server and the Electron application.

### Building for Production

#### Building the WebApp

To build the webapp for production, run:

```sh
npm run build
```

#### Building the Executable

to build the executable for production, run:

```sh
npm run compile
```

The production-ready files will be generated in the `dist` directory.

#### Building Installer Package

To generate the application installer, run:

```sh
npm run compile:installer
```

The production-ready files will be generated in the `dist` directory.

### Code Architecture

There are three packages each compiled individually:

- **`renderer`**: This is the webapp that runs on the browser, all the UI lives here.
- **`preload`**: This package run in a context with most of NodeJS APIs enabled. It's where we interact with the file system for example through the `fs` module. Modules exported from this package can be imported from the `renderer` by importing from the special path `#preload`, and all the wiring necessary to connect these two packages (namely the Electron's `exposeInWorld` APIs) are going to be done automatically by the bundler.
- **`main`**: Runs the app's NodeJS process. Communication between preload and main process is handled via IPC. This is used for invoking APIs not available in the preload package, such as Electron's APIs or forking new processes required to open Decentraland.

## Release Process

The CI pipeline is configured to automate the release process for the Decentraland Launcher.

### Steps

1. **Draft Release Creation**:

   - For every push to the main branch, the CI creates a draft release.
   - The commit message determines the type of release:
     - Patch (fix)
     - Minor (feat)
     - Major (breaking change)

2. **Artifact Generation**:

   - Artifacts for MacOS (x64 and ARM architectures) and Windows are generated and attached to the draft release.

3. **Publishing the Release**:
   - To publish a release, edit the draft release and publish it as the latest release.
   - The auto updater, as mentioned in the Update Process, will pick up this new release and update the production app.

This streamlined process ensures that updates are consistently and accurately deployed to users.
