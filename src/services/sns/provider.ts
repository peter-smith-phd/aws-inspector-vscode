import { Sns } from "../../awsClients/sns";
import { ServiceProvider } from "../serviceProvider";

export class SnsServiceProvider extends ServiceProvider {

  async getResourceArns(profile:string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "topic") {
      return (await Sns.listTopics(profile, region)).map(topic => topic.TopicArn!);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
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
