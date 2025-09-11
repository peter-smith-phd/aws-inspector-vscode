import { Lambda } from "../../awsClients/lambda";
import ARN from "../../models/arnModel";
import { FieldType, ServiceProvider } from "../serviceProvider";

export class LambdaServiceProvider extends ServiceProvider {
  
  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "function") {
      return (await Lambda.listFunctions(profile, region)).map(func => func.FunctionArn!);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public async describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType; }[]> {
    return [{
      field: "Type",
      value: "Lambda Function",
      type: FieldType.NAME
    }];
  }

  protected resourceTypes: Record<string, [string, string]> = {
    'function': ['Function', 'Functions']
  };

  getId(): string {
    return 'lambda';
  }

  getName(): string {
    return "Lambda";
  }
}
