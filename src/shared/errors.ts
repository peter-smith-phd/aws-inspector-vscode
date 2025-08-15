/**
 * Indicates that something happened inside the software that is not
 * the user's fault. It requires a software fix.
 */
export class InternalError extends Error {

  constructor(message: string) {
    super(message);
    this.name = 'InternalError';
  }
}