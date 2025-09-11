import { ActivityListItem, DescribeActivityCommand, DescribeActivityCommandOutput, DescribeStateMachineCommand, DescribeStateMachineCommandOutput, ListActivitiesCommand, ListActivitiesCommandOutput, ListStateMachinesCommand, ListStateMachinesCommandOutput, SFNClient, StateMachineListItem } from "@aws-sdk/client-sfn";
import { memoize } from "../shared/memoize";

/**
 * Accessor functions for the AWS "states" (Step Functions) service
 */
export class States {

  private static cachedGetStatesClient = memoize((profile: string, region: string) => {
    return new SFNClient({ profile, region });
  });

  /**
   * List the state machines in the specified profile/region. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listStateMachines(profile: string, region: string): Promise<StateMachineListItem[]> {
    const client = this.cachedGetStatesClient(profile, region);

    let stateMachines: StateMachineListItem[] = [];
    let nextToken: string | undefined = undefined;
    do {
      const command = new ListStateMachinesCommand({ nextToken });
      const response: ListStateMachinesCommandOutput = await client.send(command);
      if (response.stateMachines) {
        stateMachines.push(...response.stateMachines);
      }
      nextToken = response.nextToken;
    } while (nextToken);

    return stateMachines;
  }

  /**
   * Describe the state machine with the specified ARN. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async describeStateMachine(
    profile: string, region: string, arn: string
  ): Promise<DescribeStateMachineCommandOutput> {
    const client = this.cachedGetStatesClient(profile, region);
    const command = new DescribeStateMachineCommand({ stateMachineArn: arn });
    return await client.send(command);
  }

  /**
   * List the activities of the specified profile. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listActivities(profile: string, region: string): Promise<ActivityListItem[]> {
    const client = this.cachedGetStatesClient(profile, region);

    let activities: ActivityListItem[] = [];
    let nextToken: string | undefined = undefined;

    do {
      const command = new ListActivitiesCommand({ nextToken });
      const response: ListActivitiesCommandOutput = await client.send(command);
      if (response.activities) {
        activities.push(...response.activities);
      }
      nextToken = response.nextToken;
    } while (nextToken);

    return activities;
  }

  /**
   * Describe an activity in the specified profile/region. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async describeActivity(profile: string, region: string, arn: string): Promise<DescribeActivityCommandOutput> {
    const client = this.cachedGetStatesClient(profile, region);

    const command = new DescribeActivityCommand({ activityArn: arn });
    return await client.send(command);
  }
}