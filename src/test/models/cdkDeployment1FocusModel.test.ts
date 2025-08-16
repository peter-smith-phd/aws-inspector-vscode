import { Focus, loadStandardModel, RegionFocus, StandardModel } from '../../models/focusModel';
import assert from 'assert';
import { readFocusModelFromResourceFile } from '../utils';


suite('CDK Deployment 1 focus model', () => {
  let f: Focus;

  suiteSetup(() => {
    f = readFocusModelFromResourceFile('mock-cdk-deployment-1.focus.json');
  });
  
  test('Has the supported version (1.0)', () => {
    assert.strictEqual(f.version, '1.0');
  });

  test('Has the aws profile', () => {
    assert.strictEqual(f.profiles.length, 1);
    assert.strictEqual(f.profiles[0].id, 'aws');
  });

  test('Has two regions', () => {
    const regions: RegionFocus[] = f.profiles[0].regions;
    
    assert.strictEqual(regions.length, 2);
    assert.strictEqual(regions[0].id, "us-east-1");
    assert.strictEqual(regions[1].id, "ap-southeast-2");
  });

  test('Has us-east-1 region with two services', () => {
    const usEast1 = f.profiles[0].regions[0];

    assert.strictEqual(usEast1.services.length, 2);
    assert.strictEqual(usEast1.services[0].id, "lambda");
    assert.strictEqual(usEast1.services[1].id, "stepfunctions");
  });

  test('Has us-east-1 lambda service with one resource type', () => {
    const lambdaService = f.profiles[0].regions[0].services[0];

    assert.strictEqual(lambdaService.resourcetypes.length, 1);
    assert.strictEqual(lambdaService.resourcetypes[0].id, "function");
  });

  test('Has us-east-1 lambda function ARNs', () => {
    const lambdaArns = f.profiles[0].regions[0].services[0].resourcetypes[0].arns;
    assert.strictEqual(lambdaArns.length, 2);
    assert.strictEqual(lambdaArns[0], "arn:aws:lambda:us-east-1:123412341234:function:myFunc");
    assert.strictEqual(lambdaArns[1], "arn:aws:lambda:us-east-1:123412341234:function:yourFunc");
  });

  test('Has us-east-1 stepfunctions service with two resource types', () => {
    const stepFunctionsService = f.profiles[0].regions[0].services[1];

    assert.strictEqual(stepFunctionsService.resourcetypes.length, 2);
    assert.strictEqual(stepFunctionsService.resourcetypes[0].id, "activity");
    assert.strictEqual(stepFunctionsService.resourcetypes[1].id, "statemachine");
  });

  test('Has us-east-1 stepfunctions activity ARNs', () => {
    const activityArns = f.profiles[0].regions[0].services[1].resourcetypes[0].arns;

    assert.strictEqual(activityArns.length, 2);
    assert.strictEqual(activityArns[0], "arn:aws:states:us-east-1:123412341234:activity:activity1");
    assert.strictEqual(activityArns[1], "arn:aws:states:us-east-1:123412341234:activity:activity2");
  });

  test('Has us-east-1 stepfunctions statemachine ARNs', () => {
    const stateMachineArns = f.profiles[0].regions[0].services[1].resourcetypes[1].arns;

    assert.strictEqual(stateMachineArns.length, 3);
    assert.strictEqual(stateMachineArns[0], "arn:aws:states:us-east-1:123412341234:stateMachine:stateMachine1");
    assert.strictEqual(stateMachineArns[1], "arn:aws:states:us-east-1:123412341234:stateMachine:stateMachine2");
    assert.strictEqual(stateMachineArns[2], "arn:aws:states:us-east-1:123412341234:stateMachine:stateMachine3");
  });

  test('Has ap-southeast-2 region with two services', () => {
    const apSoutheast2 = f.profiles[0].regions[1];

    assert.strictEqual(apSoutheast2.services.length, 2);
    assert.strictEqual(apSoutheast2.services[0].id, "dynamodb");
    assert.strictEqual(apSoutheast2.services[1].id, "sns");
  });

  test('Has ap-southeast-2 dynamodb service with one resource type', () => {
    const dynamodbService = f.profiles[0].regions[1].services[0];

    assert.strictEqual(dynamodbService.resourcetypes.length, 1);
    assert.strictEqual(dynamodbService.resourcetypes[0].id, "table");
  });

  test('Has ap-southeast-2 dynamodb table ARNs', () => {
    const dynamodbArns = f.profiles[0].regions[1].services[0].resourcetypes[0].arns;

    assert.strictEqual(dynamodbArns.length, 2);
    assert.strictEqual(dynamodbArns[0], "arn:aws:dynamodb:ap-southeast-2:123412341234:table/myTable1");
    assert.strictEqual(dynamodbArns[1], "arn:aws:dynamodb:ap-southeast-2:123412341234:table/myTable2");
  });

  test('Has ap-southeast-2 sns service with one resource type', () => {
    const snsService = f.profiles[0].regions[1].services[1];

    assert.strictEqual(snsService.resourcetypes.length, 1);
    assert.strictEqual(snsService.resourcetypes[0].id, "topic");
  });

  test('Has ap-southeast-2 sns topic ARNs', () => {
    const snsArns = f.profiles[0].regions[1].services[1].resourcetypes[0].arns;

    assert.strictEqual(snsArns.length, 3);
    assert.strictEqual(snsArns[0], "arn:aws:sns:ap-southeast-2:123412341234:myTopic1");
    assert.strictEqual(snsArns[1], "arn:aws:sns:ap-southeast-2:123412341234:myTopic2");
    assert.strictEqual(snsArns[2], "arn:aws:sns:ap-southeast-2:123412341234:myTopic3");
  });
});