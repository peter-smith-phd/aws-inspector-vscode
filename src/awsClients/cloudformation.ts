import { CloudFormationClient, DescribeStacksCommand, ListStacksCommand, ListStacksCommandOutput, StackStatus, StackSummary } from "@aws-sdk/client-cloudformation";
import { memoize } from "../shared/memoize";
import ARN from "../models/arnModel";
import { InternalError } from "../shared/errors";

/**
 * Accessor functions for the AWS "cloudformation" service
 */
export class CloudFormation {

  private static cachedGetCloudFormationClient = memoize((profile: string, region: string) =>
    new CloudFormationClient({ profile, region })
  );

  /**
   * List the stacks of the specified profile. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listStacks(profile: string, region: string): Promise<StackSummary[]> {
    const client = this.cachedGetCloudFormationClient(profile, region);

    let stacks: StackSummary[] = [];
    let nextToken: string | undefined = undefined;

    /* 
     * This will need to be updated if AWS adds new stack statuses. We really just want to 
     * ignore the DELETE_COMPLETE status, but that means listing all the other statuses.
     */
    const nonDeletedStatuses: StackStatus[] = [
      'CREATE_IN_PROGRESS', 'CREATE_FAILED', 'CREATE_COMPLETE', 'ROLLBACK_IN_PROGRESS', 'ROLLBACK_FAILED',
      'ROLLBACK_COMPLETE', 'DELETE_IN_PROGRESS', 'DELETE_FAILED', 'UPDATE_IN_PROGRESS', 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
      'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_IN_PROGRESS', 'UPDATE_ROLLBACK_FAILED', 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
      'UPDATE_ROLLBACK_COMPLETE', 'REVIEW_IN_PROGRESS', 'IMPORT_IN_PROGRESS', 'IMPORT_COMPLETE', 'IMPORT_ROLLBACK_IN_PROGRESS',
      'IMPORT_ROLLBACK_FAILED', 'IMPORT_ROLLBACK_COMPLETE'
    ];
    do {
      const command = new ListStacksCommand({ NextToken: nextToken, StackStatusFilter: nonDeletedStatuses });
      const response: ListStacksCommandOutput = await client.send(command);
      if (response.StackSummaries) {
        stacks.push(...response.StackSummaries);
      }
      nextToken = response.NextToken;
    } while (nextToken);

    return stacks;
  };

  /**
   * Describe a specific CloudFormation stack.
   */
  public static async describeStacks(profile: string, region: string, arn: ARN) {
    const client = this.cachedGetCloudFormationClient(profile, region);

    /*
     * Note: although there might be many 'deleted' stacks with the same name
     * (with a UUID appended to the ARN), there can only be a single active stack
     * with a given name.
     */
    const command = new DescribeStacksCommand({ StackName: arn.resourceName });
    const response = await client.send(command);
    if (response.NextToken) {
      throw new InternalError("NextToken not handled for DescribeStacks call");
    }
    if (response.Stacks && response.Stacks.length > 0) {
      return response.Stacks[0];
    } else {
      throw new InternalError(`No stack found with name: ${arn.resourceName}`);
    }
  }
}