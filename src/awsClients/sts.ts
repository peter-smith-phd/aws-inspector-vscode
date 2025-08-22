import { GetCallerIdentityCommand, GetCallerIdentityCommandOutput, STSClient } from "@aws-sdk/client-sts";
import { memoize } from "../shared/memoize";

/**
 * Accessor functions for the AWS "sts" service
 */
export class STS {

  private static cachedGetStsClient = memoize((profile: string) =>
    new STSClient({ profile: profile })
  );

  private static cachedGetCallerIdentity = memoize(async (profile: string) => {
    const client = this.cachedGetStsClient(profile);
    const command = new GetCallerIdentityCommand();
    try {
      const response = await client.send(command);
      return { account: response.Account };
    } catch (ex) {
      console.error(`Failed to access profile: ${profile}`);
      return { account: undefined };
    }
  });

  /**
   * Get the caller identity of the specified profile. If the profile is not valid,
   * return undefined and let the caller behave appropriately.
   */
  public static async getCallerIdentity(profile: string): Promise<{ account: string | undefined }> {
    return this.cachedGetCallerIdentity(profile);
  }
}