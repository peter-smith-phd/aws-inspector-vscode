import { InternalError } from "../shared/errors";
import { DynamoDBServiceProvider } from "./dynamodb/provider";
import { SnsServiceProvider } from "./sns/provider";
import { StatesServiceProvider } from "./states/provider";
import { LambdaServiceProvider } from "./lambda/provider";
import { ServiceProvider } from "./serviceProvider";

/**
 * Mapping of AWS service IDs to their providers.
 */
const providers: { [key: string]: ServiceProvider } = {
    "dynamodb": new DynamoDBServiceProvider(),
    "lambda": new LambdaServiceProvider(),
    "sns": new SnsServiceProvider(),
    "states": new StatesServiceProvider(),
};

/**
 * Get the service provider for a given service ID.
 * @param id The service ID.
 * @returns The service provider for the given service ID.
 */
export function getProviderForService(id: string): ServiceProvider {
  const provider = providers[id];
  if (!provider) {
    throw new InternalError(`Unhandled service: ${id}`);
  }
  return provider;
}