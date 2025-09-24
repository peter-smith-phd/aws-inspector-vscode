import { InternalError } from "../shared/errors";
import * as vscode from 'vscode';
import * as path from 'path';
import ARN from "../models/arnModel";

/** 
 * Supported field types for resource descriptions. The type indicates
 * what operations (hyperlinking etc) can be done with the data values
 */
export enum FieldType {
    NAME = 'name', /* name, status, type, or any other short ID */
    ARN = 'arn', /* can be hyperlinked */
    DATE = 'date',
    SHORT_TEXT = 'shortText',
    LONG_TEXT = 'longText', /* can be shown in an editor for easier reading */
    JSON = 'json', /* can be shown in an editor with JSON syntax highlighting */
    NUMBER = 'number', /* numeric value, e.g. count of resources */
    LOG_GROUP = 'logGroup' /* can be hyperlinked to CloudWatch Logs */
};

/**
 * Abstract parent class for all service providers.
 */
export abstract class ServiceProvider {

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {
    /* empty */
  }

  /** 
   * Map of the provider's resource types to their human-facing names [singular, plural].
   * Must be overidden by subclasses
   */
  protected abstract resourceTypes: Record<string, [string, string]>;

  /** Provide the ID of the AWS service managed by this provider */
  abstract getId(): string;

  /** return the human-readable name of this AWS service. */
  abstract getName(): string;

  /** return the ARNs associated with the resource type */
  abstract getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]>;

  /** return the fields associated with the resource, to appear in the Resource Details view */
  abstract describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType }[]>;

  /** return the resource type names [singular, plural] for this AWS service */
  public getResourceTypeNames(resourceType: string): string[] {
    const resourceTypeNames = this.resourceTypes[resourceType];
    if (!resourceTypeNames) {
      throw new InternalError(`Unknown resource type: ${resourceType}`);
    }
    return resourceTypeNames;
  }

  /**
   * Get the resource types for this AWS service.
   * @returns An array of resource type IDs.
   */
  public getResourceTypes(): string[] {
    return Object.keys(this.resourceTypes);
  }

  /** return the relevant icon path for this AWS service. */
  public getIconPath(serviceId: string): string {
    // TODO: return both light and dark variants.
    return path.join(this.context.extensionPath, 'resources', 'icons', 'services', `${serviceId}.svg`);
  }
}