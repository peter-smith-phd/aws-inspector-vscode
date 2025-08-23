import { IAMClient, ListAccountAliasesCommand } from "@aws-sdk/client-iam";
import { memoize } from "../shared/memoize";

/**
 * Accessor functions for the AWS "iam" service
 */
export class IAM {

  private static cachedGetIamClient = memoize((profile: string) =>
    new IAMClient({ profile: profile })
  );

  private static cachedGetAccountAlias = memoize(async (profile: string) => {
    const client = this.cachedGetIamClient(profile);
    const command = new ListAccountAliasesCommand();
    try {
      const response = await client.send(command);
      if (response.AccountAliases && response.AccountAliases.length > 0) {
        return response.AccountAliases[0];
      } else {
        return '';
      }
    } catch (ex) {
      console.error(`Failed to access account aliases for: ${profile}`);
      throw ex;
    }
  });

  /**
   * Get the account alias of the specified profile. If the profile is not valid,
   * return undefined and let the caller behave appropriately. Note that only
   * the first account alias is returned.
   */
  public static async getAccountAlias(profile: string): Promise<string> {
    return this.cachedGetAccountAlias(profile);
  }
}