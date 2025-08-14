import { AccountClient, ListRegionsCommand } from "@aws-sdk/client-account";

/**
 * Accessor functions for the AWS "account" service
 */
export class Account {

  /**
   * Return the list of AWS regions available for this profile. Return
   * the short region names (e.g. "us-east-1") along with the corresponding full
   * name (e.g. "US East (N. Virginia)"). There will be no pagination of the
   * results, and the data will be cached for the lifetime of the VS Code session.
   */
  public static async listRegions(profile: string) {
    // TODO: cache this client
    const client = new AccountClient({
      profile: 'aws'
    });

    // TODO: pagination
    // TODO: merge with full region names
    const command = new ListRegionsCommand({});

    // TODO: cache the result for each different profile. This data will not
    // change on each call.
    return (await client.send(command)).Regions;
  };
}