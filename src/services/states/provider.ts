import { SFNClient, ListActivitiesCommand, ListStateMachinesCommand } from "@aws-sdk/client-sfn";
import { ServiceProvider } from "../serviceProvider";
import { States } from "../../awsClients/states";

export class StatesServiceProvider extends ServiceProvider {

  async getResourceArns(profile: string, region: string, resourceType: string): Promise<string[]> {
    if (resourceType === "activity") {
      return (await States.listActivities(profile, region)).map(activity => activity.activityArn!);

    } else if (resourceType === "statemachine") {
      return (await States.listStateMachines(profile, region)).map(stateMachine => stateMachine.stateMachineArn!);

    } else {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  protected resourceTypes: Record<string, [string, string]> = {
    'activity': ['Activity', 'Activities'],
    'statemachine': ['State Machine', 'State Machines']
  };

  getId(): string {
    return 'states';
  }

  getName(): string {
    return "Step Functions";
  }
}
