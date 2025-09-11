import { Sns } from "../../awsClients/sns";
import ARN from "../../models/arnModel";
import { FieldType, ServiceProvider } from "../serviceProvider";

export class SnsServiceProvider extends ServiceProvider {

  async getResourceArns(profile:string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "topic") {
      return (await Sns.listTopics(profile, region)).map(topic => topic.TopicArn!);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public async describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType; }[]> {
    return [{
      field: "Type",
      value: "SNS Topic",
      type: FieldType.NAME
    }];
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
