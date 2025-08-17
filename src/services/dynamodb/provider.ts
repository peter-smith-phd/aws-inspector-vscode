import { ServiceProvider } from "../serviceProvider";

export class DynamoDBServiceProvider extends ServiceProvider {
  getName(): string {
    return "DynamoDB";
  }
}
