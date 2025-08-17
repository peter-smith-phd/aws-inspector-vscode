/**
 * Abstract parent class for all service providers.
 */
export abstract class ServiceProvider {

  /** return the human-readable name of this AWS service. */
  abstract getName(): string;

  /** return the relevant icon path for this AWS service. */
  getIconPath(): string {
    return "";
  }
}