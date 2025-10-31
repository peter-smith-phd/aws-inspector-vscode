
/**
 * Test case for the AWS config model.
 */
import assert from 'assert';
import fs from 'fs';
import sinon from 'sinon';

import AWSConfig from "../../models/awsConfig";

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
    const profiles = AWSConfig.getProfileNames();
    assert.deepStrictEqual(profiles, ['default', 'user1', 'user2']);
  });

  test('should return [] for empty config file', () => {
    sinon.stub(fs, 'readFileSync').returns('');
    assert.strictEqual(AWSConfig.getProfileNames().length, 0);
  });

  test('should return [] for missing config file', () => {
    const error = new Error('File not found') as any;
    error.code = 'ENOENT';
    sinon.stub(fs, 'readFileSync').throws(error);
    assert.strictEqual(AWSConfig.getProfileNames().length, 0);
  });

  test('should handle config file with only default profile', () => {
    sinon.stub(fs, 'readFileSync').returns('[default]\nregion = us-west-2');
    assert.deepStrictEqual(AWSConfig.getProfileNames(), ['default']);
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
    assert.deepStrictEqual(AWSConfig.getProfileNames(), ['default', 'user1']);
  });

  test('should return region for a given profile', () => {
    delete process.env.AWS_REGION;
    const mockConfigContent = `
[default]
region = us-west-2

[profile user1]
region = us-east-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    assert.strictEqual(AWSConfig.getRegionForProfile('user1'), 'us-east-1');
  });

  test('should return default region for default profile', () => {
    delete process.env.AWS_REGION;
    const mockConfigContent = `
[default]
region = us-west-2

[profile user1]
region = us-east-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    assert.strictEqual(AWSConfig.getRegionForProfile('default'), 'us-west-2');
  });

  test('should return region from environment variable if set', () => {
    process.env.AWS_REGION = 'ap-south-1';
    assert.strictEqual(AWSConfig.getRegionForProfile('anyprofile'), 'ap-south-1');
    delete process.env.AWS_REGION;
  });

  test('should return undefined for non-existent profile', () => {
    const mockConfigContent = `
[default]
region = us-west-2

[profile user1]
region = us-east-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    assert.strictEqual(AWSConfig.getRegionForProfile('user2'), undefined);
  });

  test('should ignore commented-out sections', () => {
    const mockConfigContent = `
[default]
region = us-west-2

[profile user1]
region = us-east-1

# [profile user2]
# region = eu-central-1

; [profile user3]
; region = us-west-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    assert.deepStrictEqual(AWSConfig.getProfileNames(), ['default', 'user1']);
  });

  test('should throw UserConfigurationError for malformed config file', () => {
    const mockConfigContent = `
[default
region = us-west-2

[profile user1]
region = us-east-1
`;
    sinon.stub(fs, 'readFileSync').returns(mockConfigContent);
    assert.throws(() => {
      AWSConfig.getProfileNames();
    }, 'UserConfigurationError: Unsupported type of line: [2] "[default"');
  });
});