import { ServiceProvider } from "../serviceProvider";

export class LambdaServiceProvider extends ServiceProvider {
  
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
