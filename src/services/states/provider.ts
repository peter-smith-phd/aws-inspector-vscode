import { ServiceProvider } from "../serviceProvider";

export class StatesServiceProvider extends ServiceProvider {
  getName(): string {
    return "Step Functions";
  }
}
