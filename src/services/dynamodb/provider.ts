import { DynamoDB } from "../../awsClients/dynamodb";
import { ServiceProvider } from "../serviceProvider";

export class DynamoDBServiceProvider extends ServiceProvider {
  
  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "table") {
      return await DynamoDB.listTables(profile, region);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

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
