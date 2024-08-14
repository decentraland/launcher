export function isValidVersion(version: string): boolean {
  const versionRegex =
    /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return versionRegex.test(version);
}

/**
 * Parse command line arguments.
 *
 * @returns {Record<string, string>} An object containing parsed argument key-value pairs.
 */
export function parseArgv(): Record<string, string> {
  const parsedArgv: Record<string, string> = {};

  if (process.argv.length > 2) {
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i].toLowerCase();
      if (/--(version|prerelease|dev)/.test(arg)) {
        const [key, value] = arg.split('=');
        const cleanKey = key.replace('--', '');
        parsedArgv[cleanKey] = value ?? 'true';
      }
    }
  }

  return parsedArgv;
}

/**
 * Retrieves the version from the parsed command-line arguments.
 * @returns The version string if available, otherwise undefined.
 */
export function getVersion(): string | undefined {
  const parsedArgv = parseArgv();
  if (isValidVersion(parsedArgv?.version)) {
    return parsedArgv?.version;
  }
}

/**
 * Determines if should download a prerelease version of the Explorer.
 * @returns A boolean value indicating if the Explorer should be downloaded as a prerelease version.
 */
export function getIsPrerelease(): boolean {
  const parsedArgv = parseArgv();
  return parsedArgv?.prerelease === 'true';
}

export function getRunDevVersion(): boolean {
  const parsedArgv = parseArgv();
  return parsedArgv?.dev === 'true';
}
