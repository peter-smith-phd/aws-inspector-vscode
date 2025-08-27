import { AccountClient, ListRegionsCommand, ListRegionsCommandInput, RegionOptStatus } from "@aws-sdk/client-account";
import { memoize } from "../shared/memoize";

/**
 * Accessor functions for the AWS "account" service
 */
export class Account {

  private static cachedGetAccountClient = memoize((profile: string) =>
    new AccountClient({ profile: profile })
  );

  private static cachedListRegions = memoize(async (profile: string) => {
    const client = this.cachedGetAccountClient(profile);

    const request: ListRegionsCommandInput = {
      RegionOptStatusContains: [ RegionOptStatus.ENABLED_BY_DEFAULT, RegionOptStatus.ENABLED ]
    };
    const RegionNames: string[] = [];

    while (true) {
      const response = await client.send(new ListRegionsCommand(request));
      if (response.Regions) {
        RegionNames.push(...response.Regions.map(region => region.RegionName!));
      }
      if (!response.NextToken) {
        break;
      }
      request.NextToken = response.NextToken;
    }
    return RegionNames;
  });

  /**
   * Return the list of AWS regions available for this profile. For example:
   *    ['ap-southeast-2', 'us-east-1', 'us-west-2']
   */
  public static async listRegions(profile: string): Promise<string[]> {
    return this.cachedListRegions(profile);
  };
}