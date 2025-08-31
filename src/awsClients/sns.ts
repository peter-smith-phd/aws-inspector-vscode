import { ListTopicsCommand, ListTopicsCommandOutput, SNSClient, Topic } from "@aws-sdk/client-sns";
import { memoize } from "../shared/memoize";

/**
 * Accessor functions for the AWS "SNS" (Simple Notification Service) service
 */
export class Sns {

  private static cachedGetSnsClient = memoize((profile: string, region: string) => {
    return new SNSClient({ profile, region });
  });

  /**
   * List the SNS topics in the specified profile/region. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listTopics(profile: string, region: string): Promise<Topic[]> {
    const client = this.cachedGetSnsClient(profile, region);

    let topics: Topic[] = [];
    let nextToken: string | undefined = undefined;
    do {
      const command = new ListTopicsCommand({ NextToken: nextToken });
      const response: ListTopicsCommandOutput = await client.send(command);
      if (response.Topics) {
        topics.push(...response.Topics);
      }
      nextToken = response.NextToken;
    } while (nextToken);

    return topics;
  }
}