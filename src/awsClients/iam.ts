import { GetRoleCommand, GetRoleCommandOutput, IAMClient, ListAccountAliasesCommand, ListRolesCommand } from "@aws-sdk/client-iam";
import { memoize } from "../shared/memoize";
import ARN from "../models/arnModel";

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

  /**
   * List the IAM Roles in the specified profile. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listRoles(profile: string): Promise<string[]> {
    const client = this.cachedGetIamClient(profile);

    let roles: string[] = [];
    let marker: string | undefined = undefined;
    do {
      const command: ListRolesCommand = new ListRolesCommand({ Marker: marker });
      const response = await client.send(command);
      if (response.Roles) {
        roles.push(...response.Roles.map(role => role.Arn!));
      }
      marker = response.Marker;
    } while (marker);
    return roles;
  }

  /**
   * Get details about a specific IAM role.
   */
  public static async getRole(profile: string, roleArn: ARN): Promise<GetRoleCommandOutput> {
    const client = this.cachedGetIamClient(profile);

    /* Role names can be path-qualified, so we need to extract just the name part */
    let roleName = roleArn.resourceName!;
    const lastSlash = roleName.lastIndexOf('/');
    if (lastSlash !== -1) {
      roleName = roleName.substring(lastSlash + 1);
    }
    
    const command = new GetRoleCommand({ RoleName: roleName });
    return await client.send(command);
  }
}