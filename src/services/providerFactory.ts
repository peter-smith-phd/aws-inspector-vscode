import * as vscode from 'vscode';

import { InternalError } from "../shared/errors";
import { DynamoDBServiceProvider } from "./dynamodb/provider";
import { SnsServiceProvider } from "./sns/provider";
import { StatesServiceProvider } from "./states/provider";
import { LambdaServiceProvider } from "./lambda/provider";
import { ServiceProvider } from "./serviceProvider";
import { CloudFormationServiceProvider } from './cloudformation/provider';

/**
 * A factory for providing access to AWS service providers.
 */
export class ProviderFactory {
  /**
   * Mapping of AWS service IDs to their providers.
   */
  private static providers: { [key: string]: ServiceProvider };

  /**
   * Initialize the ProviderFactory so it's able to provide service provider
   * instances.
   */
  public static initialize(context: vscode.ExtensionContext) {
    ProviderFactory.providers = {
      'cloudformation': new CloudFormationServiceProvider(context),
      'dynamodb': new DynamoDBServiceProvider(context),
      'lambda': new LambdaServiceProvider(context),
      'sns': new SnsServiceProvider(context),
      'states': new StatesServiceProvider(context),
    };
  };

  /**
   * Get the service provider for a given service ID. It should not be
   * possible to pass an illegal name into this method, so treat it like
   * an internal error.
   * 
   * @param id The service ID.
   * @returns The service provider for the given service ID.
   */
  public static getProviderForService(id: string): ServiceProvider {
    const provider = ProviderFactory.providers[id];
    if (!provider) {
      throw new InternalError(`Unhandled service: ${id}`);
    }
    return provider;
  }

  /**
   * Return the complete list of supported ServiceProviders, in alphabetical
   * (display) order.
   */
  public static getSupportedServices(): ServiceProvider[] {
    return Object.values(ProviderFactory.providers);
  }
}