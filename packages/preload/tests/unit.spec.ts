import { describe, expect, it } from 'vitest';
import { getIsPrerelease, getVersion, parseArgv } from '../src/argvs';

describe('parseArgv', () => {
  it('should return an empty object when no arguments are provided', () => {
    const result = parseArgv();
    expect(result).toEqual({});
  });

  it('should parse version argument correctly', () => {
    process.argv = ['node', 'script.js', '--version=1.0.0'];
    const result = parseArgv();
    expect(result).toEqual({ version: '1.0.0' });
  });

  it('should parse prerelease argument correctly', () => {
    process.argv = ['node', 'script.js', '--prerelease=true'];
    const result = parseArgv();
    expect(result).toEqual({ prerelease: 'true' });
  });

  it('should parse multiple arguments correctly', () => {
    process.argv = ['node', 'script.js', '--version=1.0.0', '--prerelease'];
    const result = parseArgv();
    expect(result).toEqual({ version: '1.0.0', prerelease: 'true' });
  });
});

describe('getVersion', () => {
  it('should return undefined when version is not provided', () => {
    process.argv = ['node', 'script.js'];
    const result = getVersion();
    expect(result).toBeUndefined();
  });

  it('should return undefined when version is not valid', () => {
    process.argv = ['node', 'script.js', '--version=1.0'];
    const result = getVersion();
    expect(result).toBeUndefined();
  });

  describe('should return the version when it is valid', () => {
    it.each(['v1.0.0', 'v1.0.1-alpha'])('version: %s', version => {
      process.argv = ['node', 'script.js', `--version=${version}`];
      const result = getVersion();
      expect(result).toEqual(version);
    });
  });
});

describe('getIsPrerelease', () => {
  it('should return false when --prerelease argument is not provided', () => {
    process.argv = ['node', 'script.js'];
    const result = getIsPrerelease();
    expect(result).toBe(false);
  });

  it('should return true when --prerelease argument is provided', () => {
    process.argv = ['node', 'script.js', '--prerelease'];
    const result = getIsPrerelease();
    expect(result).toBe(true);
  });
});
