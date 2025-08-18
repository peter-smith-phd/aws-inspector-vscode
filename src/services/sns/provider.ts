import { ServiceProvider } from "../serviceProvider";

export class SnsServiceProvider extends ServiceProvider {

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
