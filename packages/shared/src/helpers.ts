export function getErrorMessage(error: unknown): string {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.toString();
  } else if (typeof error === 'object' && error !== null && 'toString' in error && typeof error.toString === 'function') {
    errorMessage = error.toString();
  } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error';
  }

  return errorMessage;
}

export enum PLATFORM {
  MAC = 'macos',
  LINUX = 'linux',
  WINDOWS = 'windows64',
  UNSUPPORTED = 'unsupported',
}
