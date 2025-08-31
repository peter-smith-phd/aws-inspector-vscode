import { FunctionConfiguration, LambdaClient, ListFunctionsCommand, ListFunctionsCommandOutput } from "@aws-sdk/client-lambda";
import { memoize } from "../shared/memoize";

/**
 * Accessor functions for the AWS "Lambda" service
 */
export class Lambda {

  private static cachedGetLambdaClient = memoize((profile: string, region: string) => {
    return new LambdaClient({ profile, region });
  });

  /**
   * List the Lambda functions in the specified profile/region. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listFunctions(profile: string, region: string): Promise<FunctionConfiguration[]> {
    const client = this.cachedGetLambdaClient(profile, region);

    let functions: FunctionConfiguration[] = [];
    let nextToken: string | undefined = undefined;
    do {
      const command = new ListFunctionsCommand({ Marker: nextToken });
      const response: ListFunctionsCommandOutput = await client.send(command);
      if (response.Functions) {
        functions.push(...response.Functions);
      }
      nextToken = response.NextMarker;
    } while (nextToken);

    return functions;
  }
}