import { table } from "console";
import { memoize } from "../shared/memoize";
import { DescribeTableCommand, DescribeTableCommandOutput, DynamoDBClient, ListTablesCommand, ListTablesCommandOutput } from "@aws-sdk/client-dynamodb";

/**
 * Accessor functions for the AWS "DynamoDB" service
 */
export class DynamoDB {

  private static cachedGetDynamoDBClient = memoize((profile: string, region: string) => {
    return new DynamoDBClient({ profile, region });
  });

  /**
   * List the DynamoDB tables in the specified profile/region. If the profile is not valid,
   * reject the promise and let the caller behave appropriately.
   */
  public static async listTables(profile: string, region: string): Promise<string[]> {
    const client = this.cachedGetDynamoDBClient(profile, region);

    let tables: string[] = [];
    let exclusiveStartTableName: string | undefined = undefined;
    do {
      const command = new ListTablesCommand({ ExclusiveStartTableName: exclusiveStartTableName });
      const response: ListTablesCommandOutput = await client.send(command);

      if (response.TableNames) {
        tables.push(...response.TableNames);
      }
      exclusiveStartTableName = response.LastEvaluatedTableName;
    } while (exclusiveStartTableName);

    /*
     * We only have the table names, but we require table ARNs. To get the ARNs, we describe
     * the first table (if there is one), extract the TableArn field, and use that to construct
     * the full ARN for each table.
     */
    if (tables.length === 0) {
      return [];
    } else {
        const command = new DescribeTableCommand({ TableName: tables[0] });
        const response: DescribeTableCommandOutput = await client.send(command);
        if (response.Table) {
          const tableArn = response.Table.TableArn!;
          const arnPrefix = tableArn.substring(0, tableArn.lastIndexOf('/') + 1);
          return tables.map(tableName => arnPrefix + tableName);
        } else {
          throw new Error(`Failed to describe DynamoDB table: ${tables[0]}`);
        }
    }
  }
}