
/**
 * Test case for the AWS config model.
 */
import assert from 'assert';
import fs from 'fs';
import sinon from 'sinon';

import { getProfiles } from "../../models/awsConfig";

suite('AWS Config Model', () => {
  teardown(() => {
    sinon.restore();
  });

  test('should correctly parse profile names from AWS config file', () => {
      const mockConfigContent = `
[default]
region = us-west-2

[profile user1]
region = us-east-1

[profile user2]
region = eu-west-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    const profiles = getProfiles();
    assert.deepStrictEqual(profiles, ['default', 'user1', 'user2']);
  });

  test('should return [] for empty config file', () => {
    sinon.stub(fs, 'readFileSync').returns('');
    const profiles = getProfiles();
    assert.strictEqual(getProfiles().length, 0);
  });

  test('should return [] for missing config file', () => {
    sinon.stub(fs, 'readFileSync').throws(new Error('File not found'));
    assert.strictEqual(getProfiles().length, 0);
  });

  test('should handle config file with only default profile', () => {
    sinon.stub(fs, 'readFileSync').returns('[default]\nregion = us-west-2');
    const profiles = getProfiles();
    assert.deepStrictEqual(profiles, ['default']);
  });

  test('should ignore non-profile sections', () => {
    const mockConfigContent = `
profile_stuff = 5    
[default]
region = us-west-2

[not_a_profile]
some_key = some_value

[profile user1]
region = us-east-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    const profiles = getProfiles();
    assert.deepStrictEqual(profiles, ['default', 'user1']);
  });
});