import { ServiceProvider } from "../serviceProvider";

export class StatesServiceProvider extends ServiceProvider {

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
