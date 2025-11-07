import { StackResourceSummary } from "@aws-sdk/client-cloudformation";
import { Sqs } from "../../awsClients/sqs";
import ARN from "../../models/arnModel";
import { FieldType, ServiceProvider, ServiceResourceArnTuple } from "../serviceProvider";

export class SqsServiceProvider extends ServiceProvider {

  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "queue") {
      return await Sqs.listQueues(profile, region);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public async describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType; }[]> {
    /* Note: the "queue" type is the only resource for SQS, and it's not specified in the ARN */
    const attributes = await Sqs.getQueueAttributes(profile, arn.region, arn);
    if (!attributes) {
      throw new Error(`No attributes found for queue ARN: ${arn.toString()}`);
    }
    return [
      { field: "Resource Type", value: "Queue", type: FieldType.NAME },
      { field: "Name", value: arn.resourceName || 'N/A', type: FieldType.NAME },
      { field: "Visibility Timeout", value: attributes.VisibilityTimeout || 'N/A', type: FieldType.NUMBER },
      { field: "Maximum Message Size", value: attributes.MaximumMessageSize || 'N/A', type: FieldType.NUMBER },
      { field: "Message Retention Period", value: attributes.MessageRetentionPeriod || 'N/A', type: FieldType.NUMBER },
      { field: "Delay Seconds", value: attributes.DelaySeconds || 'N/A', type: FieldType.NUMBER },
      { field: "Receive Message Wait Time Seconds", value: attributes.ReceiveMessageWaitTimeSeconds || 'N/A', type: FieldType.NUMBER },
      { field: "SQS Managed SSE Enabled", value: attributes.SqsManagedSseEnabled || false, type: FieldType.NAME },
      { field: "Approximate Number of Messages", value: attributes.ApproximateNumberOfMessages || 0, type: FieldType.NUMBER },
      { field: "Approximate Number of Messages Delayed", value: attributes.ApproximateNumberOfMessagesDelayed || 0, type: FieldType.NUMBER },
      { field: "Approximate Number of Messages Not Visible", value: attributes.ApproximateNumberOfMessagesNotVisible || 0, type: FieldType.NUMBER },
      { field: "Created Timestamp", value: new Date(parseInt(attributes.CreatedTimestamp)).toISOString(), type: FieldType.DATE },
      { field: "Last Modified Timestamp", value: new Date(parseInt(attributes.LastModifiedTimestamp)).toISOString(), type: FieldType.DATE }
    ];
  }

  public getArnForCloudFormationResource(resourceTypeName: string, cfnResource: StackResourceSummary): ServiceResourceArnTuple {
    throw new Error(`Unsupported SQS resource type: ${resourceTypeName}`);
  }

  protected resourceTypes: Record<string, [string, string]> = {
    'queue': ['Queue', 'Queues']
  };

  getId(): string {
    return 'sqs';
  }

  getName(): string {
    return "SQS";
  }
}
