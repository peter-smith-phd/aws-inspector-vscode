import fs from 'fs';
import os from 'os';
import path from 'path';
import { parse } from 'js-ini';

const AWS_CONFIG_FILE = path.join(os.homedir(), '.aws', 'config');

/**
 * Read the content of the standard .aws/config file used by AWS CLI.
 */
export function getProfiles(): string[] {
  try {
    const configContent = fs.readFileSync(AWS_CONFIG_FILE, 'utf-8');
    const parsedConfig = parse(configContent);

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
