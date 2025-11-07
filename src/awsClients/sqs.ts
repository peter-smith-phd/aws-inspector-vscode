import { GetQueueAttributesCommand, GetQueueUrlCommand, ListQueuesCommand, ListQueuesCommandOutput, SQSClient } from "@aws-sdk/client-sqs";
import { memoize } from "../shared/memoize";
import ARN from "../models/arnModel";

/**
 * Accessor functions for the AWS "SQS" (Simple Queue Service) service
 */
export class Sqs {

  private static cachedGetSqsClient = memoize((profile: string, region: string) => {
    return new SQSClient({ profile, region });
  });

  /**
   * List the SQS queues in the specified profile/region. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listQueues(profile: string, region: string): Promise<string[]> {
    const client = this.cachedGetSqsClient(profile, region);

    let queueUrls: string[] = [];
    let nextToken: string | undefined = undefined;
    do {
      const command = new ListQueuesCommand({ NextToken: nextToken });
      const response: ListQueuesCommandOutput = await client.send(command);
      if (response.QueueUrls) {
        queueUrls.push(...response.QueueUrls);
      }
      nextToken = response.NextToken;
    } while (nextToken);

    /* 
    * Iterate through the queueURLs and call getQueueAttributes to fetch the corresponding ARN.
    * This is not a very scalable solution, but it does ensure we get the ARN correct (including
    * for non-standard AWS partitions)
    */
    const queueArns = await Promise.all(queueUrls.map(async (url) => {
      const command = new GetQueueAttributesCommand({ QueueUrl: url , AttributeNames: ['QueueArn'] });
      const attributes = await client.send(command);
      return attributes.Attributes!.QueueArn!;
    }));

    return queueArns;
  }

  /**
   * Get the all attributes of an SQS queue.
   */
  public static async getQueueAttributes(profile: string, region: string, queueArn: ARN): Promise<any> {
    const client = this.cachedGetSqsClient(profile, region);

    /* 
     * Convert the ARN to a queue URL by calling getQueueUrl. This is necessary because SQS doesn't use
     * standard ARN formats for querying resources.
     */
    const getUrlCommand = new GetQueueUrlCommand({ QueueName: queueArn.resourceName });
    const queueUrl = await client.send(getUrlCommand).then(response => response.QueueUrl!);

    const command = new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['All'] });
    return (await client.send(command)).Attributes;
  }
}