import { Sns } from "../../awsClients/sns";
import ARN from "../../models/arnModel";
import { FieldType, ServiceProvider } from "../serviceProvider";

export class SnsServiceProvider extends ServiceProvider {

  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "topic") {
      return (await Sns.listTopics(profile, region)).map(topic => topic.TopicArn!);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public async describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType; }[]> {
    /* Note: the "topic" type is the only resource for SNS, and it's not specified in the ARN */
    const attributes = (await Sns.getTopicAttributes(profile, arn.region, arn.arn)).Attributes;
    if (!attributes) {
      throw new Error(`No attributes found for topic ARN: ${arn.toString()}`);
    }
    return [
      { field: "Resource Type", value: "Topic", type: FieldType.NAME },
      { field: "Name", value: arn.resourceName || 'N/A', type: FieldType.NAME },
      { field: "Display Name", value: attributes.DisplayName || 'N/A', type: FieldType.NAME },
      { field: "Subscriptions Confirmed", value: attributes.SubscriptionsConfirmed || '0', type: FieldType.NUMBER },
      { field: "Subscriptions Pending", value: attributes.SubscriptionsPending || '0', type: FieldType.NUMBER },
      { field: "Subscriptions Deleted", value: attributes.SubscriptionsDeleted || '0', type: FieldType.NUMBER },
      { field: "Policy", value: attributes.Policy || 'N/A', type: FieldType.JSON },
      { field: "Effective Delivery Policy", value: attributes.EffectiveDeliveryPolicy || 'N/A', type: FieldType.JSON }
    ];
  }

  protected resourceTypes: Record<string, [string, string]> = {
    'topic': ['Topic', 'Topics']
  };

  getId(): string {
    return 'sns';
  }

  getName(): string {
    return "SNS";
  }
}
