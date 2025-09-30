import fs from 'fs';
import os from 'os';
import path from 'path';
import { parse } from 'js-ini';

/**
 * Class to handle reading AWS configuration files and extracting profiles and regions.
 */
export default class AWSConfig {

  private static AWS_CONFIG_FILE = path.join(os.homedir(), '.aws', 'config');

  /**
   * Return the names of profiles found in the AWS config file. This will include 'default'
   * as the name of the default profile.
   */
  public static getProfileNames(): string[] {
    try {
      const parsedConfig = AWSConfig.readAWSConfigFile();

      const profiles: string[] = [];
      for (const section in parsedConfig) {
        if (typeof parsedConfig[section] === 'object') {
          if (section.startsWith('profile ')) {
            profiles.push(section.replace('profile ', ''));
          } else if (section === 'default') {
            profiles.push('default');
          }
        }
      }
      return profiles;
    } catch (err) {
      /* file not found or other error */
      return [];
    }
  }

  /**
   * Return the default region name. First, check the AWS_REGION environment variable,
   * and then check the .aws/config file.
   */
  public static getRegionForProfile(profile: string): string | undefined {
    try {
      /* The environment variable takes precedence */
      if (process.env.AWS_REGION) {
        return process.env.AWS_REGION;
      }

      const parsedConfig = AWSConfig.readAWSConfigFile();

      const section = profile === 'default' ? 'default' : `profile ${profile}`;
      if (parsedConfig[section] && typeof parsedConfig[section] === 'object') {
        return (parsedConfig[section] as any)['region'];
      }
      return undefined;
    } catch (err) {
      /* file not found or other error */
      return undefined;
    }
  }

  private static readAWSConfigFile() {
    const configContent = fs.readFileSync(AWSConfig.AWS_CONFIG_FILE, 'utf-8');
    const parsedConfig = parse(configContent);
    return parsedConfig;
  }
}