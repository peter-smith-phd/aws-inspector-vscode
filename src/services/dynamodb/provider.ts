import { ServiceProvider } from "../serviceProvider";

export class DynamoDBServiceProvider extends ServiceProvider {
  
  protected resourceTypes: Record<string, [string, string]> = {
    'table': ['Table', 'Tables']
  };

  getId(): string {
    return 'dynamodb';
  }
  
  getName(): string {
    return "DynamoDB";
  }
}
