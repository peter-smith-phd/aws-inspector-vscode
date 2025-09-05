import { InternalError } from "../shared/errors";

/**
 * Get the long name of an AWS region.
 * @param region The short name of the region (e.g., "us-east-1").
 * @returns The long name of the region (e.g., "US East (N. Virginia)").
 */
export function getRegionLongName(region: string): string {
  /* 
   * To save an API call (or many), we hard-code these region names.
   * AWS will add more over time and we can update this list as needed.
   */
  const regionNames: { [key: string]: string } = {
    'af-south-1': 'Africa (Cape Town)',
    'ap-east-1': 'Asia Pacific (Hong Kong)',
    'ap-east-2': 'Asia Pacific (Taipei)',
    'ap-south-1': 'Asia Pacific (Mumbai)',
    'ap-south-2': 'Asia Pacific (Hyderabad)',
    'ap-northeast-1': 'Asia Pacific (Tokyo)',
    'ap-northeast-2': 'Asia Pacific (Seoul)',
    'ap-northeast-3': 'Asia Pacific (Osaka)',
    'ap-southeast-1': 'Asia Pacific (Singapore)',
    'ap-southeast-2': 'Asia Pacific (Sydney)',
    'ap-southeast-3': 'Asia Pacific (Jakarta)',
    'ap-southeast-4': 'Asia Pacific (Melbourne)',
    'ap-southeast-5': 'Asia Pacific (Malaysia)',
    'ap-southeast-6': 'Asia Pacific (New Zealand)',
    'ap-southeast-7': 'Asia Pacific (Thailand)',
    'ca-central-1': 'Canada (Central)',
    'ca-west-1': 'Canada West (Calgary)',
    'eu-central-1': 'Europe (Frankfurt)',
    'eu-central-2': 'Europe (Zurich)',
    'eu-north-1': 'Europe (Stockholm)',
    'eu-south-1': 'Europe (Milan)',
    'eu-south-2': 'Europe (Spain)',
    'eu-west-1': 'Europe (Ireland)',
    'eu-west-2': 'Europe (London)',
    'eu-west-3': 'Europe (Paris)',
    'il-central-1': 'Israel (Tel Aviv)',
    'me-south-1': 'Middle East (Bahrain)',
    'me-central-1': 'Middle East (UAE)',
    'mx-central-1': 'Mexico (Central)',
    'sa-east-1': 'South America (São Paulo)',
    'us-east-1': 'US East (N. Virginia)',
    'us-east-2': 'US East (Ohio)',
    'us-gov-east-1': 'AWS GovCloud (US-East)',
    'us-gov-west-1': 'AWS GovCloud (US-West)',
    'us-west-1': 'US West (N. California)',
    'us-west-2': 'US West (Oregon)',
  };

  if (!regionNames[region]) {
    throw new InternalError(`Unknown region: ${region}. The AWS Inspector region information might need to be updated.`);
  }
  return regionNames[region];
}
