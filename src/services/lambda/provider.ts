import { ServiceProvider } from "../serviceProvider";

export class LambdaServiceProvider extends ServiceProvider {
  getName(): string {
    return "Lambda";
  }
}
