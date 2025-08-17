import { ServiceProvider } from "../serviceProvider";

export class SnsServiceProvider extends ServiceProvider {
  getName(): string {
    return "SNS";
  }
}
