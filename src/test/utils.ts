/*
 * Various helper functions to make test cases easier to write.
 */
import * as fs from 'fs';
import path from 'path';
import { Focus } from '../models/focusModel';

/**
 * Reads a focus model from a JSON resource file. This is for test purposes only,
 * and doesn't provide error checking or caching
 * 
 * @param filePath The path to the JSON file.
 * @returns The parsed focus model.
 */
export function readFocusModelFromResourceFile(filePath: string): any {
  /* Note: tests are run within the ./out directory, and resources are in ./src */
  const jsonString: string = fs.readFileSync(path.resolve(__dirname, `../../src/test/resources/${filePath}`), 'utf-8');
  return Focus.parse(JSON.parse(jsonString));
}
