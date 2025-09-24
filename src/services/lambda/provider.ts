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
    const resourceType = arn.resourceType?.toLowerCase();
    if (resourceType === 'function') {
      const functionInfo = await Lambda.getFunction(profile, arn.region, arn);
      return [
        { field: "Resource Type", value: "Function", type: FieldType.NAME },
        { field: "Name", value: functionInfo.FunctionName!, type: FieldType.NAME },
        { field: "State", value: functionInfo.State!, type: FieldType.NAME },
        { field: "Description", value: functionInfo.Description || 'N/A', type: FieldType.NAME },
        { field: "Runtime", value: functionInfo.Runtime!, type: FieldType.NAME },
        { field: "Handler", value: functionInfo.Handler!, type: FieldType.NAME },
        { field: "Version", value: functionInfo.Version!, type: FieldType.NAME },
        { field: "Role", value: functionInfo.Role!, type: FieldType.ARN },
        { field: "Code Size (bytes)", value: functionInfo.CodeSize!.toString(), type: FieldType.NUMBER },
        { field: "Memory Size (MB)", value: functionInfo.MemorySize!.toString(), type: FieldType.NUMBER },
        { field: "Timeout (seconds)", value: functionInfo.Timeout!.toString(), type: FieldType.NUMBER },
        { field: "Last Modified", value: functionInfo.LastModified!, type: FieldType.DATE },
        { field: "Last Update Status", value: functionInfo.LastUpdateStatus!, type: FieldType.NAME },
        { field: "Package Type", value: functionInfo.PackageType!, type: FieldType.NAME },
        { field: "Architectures", value: (functionInfo.Architectures || []).join(', ') || 'N/A', type: FieldType.NAME },
        { field: "LogFormat", value: functionInfo.LoggingConfig?.LogFormat || 'N/A', type: FieldType.NAME },
        { field: "LogGroup", value: functionInfo.LoggingConfig?.LogGroup || 'N/A', type: FieldType.LOG_GROUP },
      ];
    } else {
      throw new Error(`Unsupported resource type for Lambda: ${arn.resourceType}`);
    }
  }
  /*
"Configuration": {
        "FunctionName": "sqs-lambda-stack-ProcessorFunction-HRaXXljiO96B",
        "FunctionArn": "arn:aws:lambda:ap-southeast-2:354918407227:function:sqs-lambda-stack-ProcessorFunction-HRaXXljiO96B",
        "Runtime": "python3.13",
        "Role": "arn:aws:iam::354918407227:role/sqs-lambda-stack-ProcessorFunctionRole-Y5z4ROokNnzm",
        "Handler": "app.lambda_handler",
        "CodeSize": 416,
        "Description": "",
        "Timeout": 3,
        "MemorySize": 128,
        "LastModified": "2025-08-18T17:56:22.454+0000",
        "CodeSha256": "55v95x1oXjQEAwOfhkQQTRxSpEEXz8JnDsUvK9jCe4g=",
        "Version": "$LATEST",
        "DeadLetterConfig": {
            "TargetArn": "arn:aws:sqs:ap-southeast-2:354918407227:sqs-lambda-stack-ProcessingDLQ-I5zmIEbmTJBk"
        },
        "TracingConfig": {
            "Mode": "PassThrough"
        },
        "RevisionId": "291b16bc-e11f-4408-8618-49fb1a10808a",
        "State": "Active",
        "LastUpdateStatus": "Successful",
        "PackageType": "Zip",
        "Architectures": [
            "arm64"
        ],
        "EphemeralStorage": {
            "Size": 512
        },
        "SnapStart": {
            "ApplyOn": "None",
            "OptimizationStatus": "Off"
        },
        "RuntimeVersionConfig": {
            "RuntimeVersionArn": "arn:aws:lambda:ap-southeast-2::runtime:2a7584173d2507ead35fecec5cb4db34186308ee06a9f8add526a8bf72f80f2d"
        },
        "LoggingConfig": {
            "LogFormat": "Text",
            "LogGroup": "/aws/lambda/sqs-lambda-stack-ProcessorFunction-HRaXXljiO96B"
        }
  */

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
