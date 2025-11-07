import { StackResourceSummary } from "@aws-sdk/client-cloudformation";
import { IAM } from "../../awsClients/iam";
import ARN from "../../models/arnModel";
import { FieldType, ServiceProvider, ServiceResourceArnTuple } from "../serviceProvider";

export class IAMServiceProvider extends ServiceProvider {
  
  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "role") {
      return await IAM.listRoles(profile);
    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public async describeResource(profile: string, arn: ARN): Promise<{ field: string; value: string; type: FieldType; }[]> {
    const resourceType = arn.resourceType?.toLowerCase();
    if (resourceType === 'role') {
      const details = await IAM.getRole(profile, arn);
      if (!details.Role) {
        throw new Error(`Failed to get details for role: ${arn.toString()}`);
      }
      const role = details.Role;

      return [
        { field: 'Resource Type', value: 'Role', type: FieldType.NAME },
        { field: 'Role Name', value: role.RoleName!, type: FieldType.NAME },
        { field: 'Role ID', value: role.RoleId!, type: FieldType.NAME },
        { field: 'Path', value: role.Path!, type: FieldType.SHORT_TEXT },
        { field: 'Description', value: role.Description || '', type: FieldType.SHORT_TEXT },
        { field: 'Max Session Duration', value: role.MaxSessionDuration ? role.MaxSessionDuration.toString() : 'N/A', type: FieldType.NUMBER },
        { field: 'Created', value: role.CreateDate!.toISOString(), type: FieldType.DATE },
        { field: 'Last Used', value: role.RoleLastUsed?.LastUsedDate ? role.RoleLastUsed.LastUsedDate.toISOString() : 'N/A', type: FieldType.DATE },
        { field: 'Assume Role Policy', value: role.AssumeRolePolicyDocument ? decodeURIComponent(role.AssumeRolePolicyDocument) : 'N/A', type: FieldType.JSON },
      ];
    } else {
      throw new Error(`Unknown resource type for ARN: ${arn.toString()}`);
    }
  }

  public getArnForCloudFormationResource(resourceTypeName: string, cfnResource: StackResourceSummary): ServiceResourceArnTuple {
    throw new Error(`Unsupported IAM resource type: ${resourceTypeName}`);
  }

  protected resourceTypes: Record<string, [string, string]> = {
    'role': ['Role', 'Roles']
  };

  getId(): string {
    return 'iam';
  }

  getName(): string {
    return "IAM";
  }
}
