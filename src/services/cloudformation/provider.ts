import { StackResourceSummary, StackSummary } from "@aws-sdk/client-cloudformation";
import { CloudFormation } from "../../awsClients/cloudformation";
import ARN from "../../models/arnModel";
import { FieldType, ServiceProvider, ServiceResourceArnTuple } from "../serviceProvider";

export class CloudFormationServiceProvider extends ServiceProvider {
  
  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "stack") {
      const stackIds = (await CloudFormation.listStacks(profile, region)).map(stack => stack.StackId!);
      stackIds.sort();
      return stackIds;
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public async describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType; }[]> {
    const resourceType = arn.resourceType?.toLowerCase();
    if (resourceType === 'stack') {
      const details = await CloudFormation.describeStacks(profile, arn.region, arn);

      const parameterFields = details.Parameters ? details.Parameters.map(param => {
        return { field: `    ${param.ParameterKey}`, value: param.ParameterValue || 'N/A', type: FieldType.NAME };
      }) : [];
      
      const outputFields = details.Outputs ? details.Outputs.map(output => {
        return { field: `    ${output.OutputKey}`, value: output.OutputValue || 'N/A', type: FieldType.NAME };
      }) : [];

      return [
        { field: "Resource Type", value: "Stack", type: FieldType.NAME },
        { field: "Stack Name", value: details.StackName!, type: FieldType.NAME },
        { field: "Stack Status", value: details.StackStatus!, type: FieldType.NAME },
        { field: "Description", value: details.Description ?? 'N/A', type: FieldType.SHORT_TEXT },
        { field: "Change Set ARN", value: details.ChangeSetId ?? 'N/A', type: FieldType.ARN },
        { field: "Creation Time", value: details.CreationTime?.toISOString() ?? 'N/A', type: FieldType.DATE },
        { field: "Last Updated Time", value: details.LastUpdatedTime?.toISOString() ?? 'N/A', type: FieldType.DATE },
        { field: "Termination Protection", value: details.EnableTerminationProtection ? 'Enabled' : 'Disabled', type: FieldType.NAME },
        { field: "Rollback", value: details.DisableRollback ? 'Disabled' : 'Enabled', type: FieldType.NAME },
        { field: "Capabilities", value: details.Capabilities ? details.Capabilities.join(', ') : 'None', type: FieldType.SHORT_TEXT },
        { field: "Drift Status", value: details.DriftInformation?.StackDriftStatus ?? 'N/A', type: FieldType.NAME },
        { field: "Parameters", value: '', type: FieldType.NAME },
        ...parameterFields,
        { field: "Outputs", value: '', type: FieldType.NAME },
        ...outputFields
      ];
    } else {
      throw new Error(`Unknown resource type for ARN: ${arn.toString()}`);
    }
  }

  public getArnForCloudFormationResource(resourceTypeName: string, cfnResource: StackResourceSummary): ServiceResourceArnTuple {
    throw new Error(`Unsupported CloudFormation resource type: ${resourceTypeName}`);
  }

  protected resourceTypes: Record<string, [string, string]> = {
    'stack': ['Stack', 'Stacks']
  };

  getId(): string {
    return 'cloudformation';
  }

  getName(): string {
    return "CloudFormation";
  }
}
