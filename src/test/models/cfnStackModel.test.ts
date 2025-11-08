import assert from 'assert';
import CfnStackModel from '../../models/cfnStackModel';
import ARN from '../../models/arnModel';
import { CloudFormation } from '../../awsClients/cloudformation';
import sinon from 'sinon';
import { StackResourceSummary } from '@aws-sdk/client-cloudformation';
import { ProviderFactory } from '../../services/providerFactory';
import { ExtensionContext } from 'vscode';
import { Lambda } from '../../awsClients/lambda';

suite('CfnStackModel.toFocusModel', () => {

  const mockCloudFormationStackArn = 
    new ARN('arn:aws:cloudformation:ap-southeast-2:000000000000:stack/sqs-lambda-stack/81e55050-7c5c-11f0-8b3c-0256e5ff511b');

  const mockListStackResources: StackResourceSummary[] = [
    {
      "LogicalResourceId": "ProcessingDLQ",
      "PhysicalResourceId": "https://sqs.ap-southeast-2.amazonaws.com/000000000000/sqs-lambda-stack-ProcessingDLQ-I5zmIEbmTJBk",
      "ResourceType": "AWS::SQS::Queue",
      "LastUpdatedTimestamp": new Date("2025-08-18T17:56:00.244Z"),
      "ResourceStatus": "CREATE_COMPLETE",
      "DriftInformation": {
        "StackResourceDriftStatus": "NOT_CHECKED"
      }
    },
    {
      "LogicalResourceId": "ProcessingQueue",
      "PhysicalResourceId": "https://sqs.ap-southeast-2.amazonaws.com/000000000000/sqs-lambda-stack-ProcessingQueue-75nQhRWPuhMN",
      "ResourceType": "AWS::SQS::Queue",
      "LastUpdatedTimestamp": new Date("2025-08-18T17:56:02.027Z"),
      "ResourceStatus": "CREATE_COMPLETE",
      "DriftInformation": {
        "StackResourceDriftStatus": "NOT_CHECKED"
      }
    },
    {
      "LogicalResourceId": "ProcessorFunction",
      "PhysicalResourceId": "sqs-lambda-stack-ProcessorFunction-HRaXXljiO96B",
      "ResourceType": "AWS::Lambda::Function",
      "LastUpdatedTimestamp": new Date("2025-08-18T17:56:29.013Z"),
      "ResourceStatus": "CREATE_COMPLETE",
      "DriftInformation": {
        "StackResourceDriftStatus": "NOT_CHECKED"
      }
    },
    {
      "LogicalResourceId": "ProcessorFunctionMySQSEvent",
      "PhysicalResourceId": "91edff81-dd21-4bb6-bd38-776153ec2d50",
      "ResourceType": "AWS::Lambda::EventSourceMapping",
      "LastUpdatedTimestamp": new Date("2025-08-18T17:56:41.805Z"),
      "ResourceStatus": "CREATE_COMPLETE",
      "DriftInformation": {
        "StackResourceDriftStatus": "NOT_CHECKED"
      }
    },
    {
      "LogicalResourceId": "ProcessorFunctionRole",
      "PhysicalResourceId": "sqs-lambda-stack-ProcessorFunctionRole-Y5z4ROokNnzm",
      "ResourceType": "AWS::IAM::Role",
      "LastUpdatedTimestamp": new Date("2025-08-18T17:56:19.842Z"),
      "ResourceStatus": "CREATE_COMPLETE",
      "DriftInformation": {
        "StackResourceDriftStatus": "NOT_CHECKED"
      }
    }
  ];

  const mockExtensionContext = {
    extensionPath: '/mock-path'
  } as unknown as ExtensionContext;
  
  setup(() => {
    ProviderFactory.initialize(mockExtensionContext);
  });

  teardown(() => {
    sinon.restore();
  });

  test('should throw error for invalid ARN (if not a CloudFormation stack)', () => {
    assert.throws(() => {
      new CfnStackModel(
        'aws',
        new ARN('arn:aws:s3:::my_corporate_bucket/exampleobject.png'));
    }, /Invalid CloudFormation Stack ARN/);
  });

  test('should convert CfnStackModel to Focus model with a single region', async () => {
    const cfnStack = new CfnStackModel('aws', mockCloudFormationStackArn);
    sinon.stub(CloudFormation, 'listStackResources').resolves([]);
    const focusModel = await cfnStack.toFocusModel();

    assert.strictEqual(focusModel.version, '1.0');
    assert.strictEqual(focusModel.profiles.length, 1);
    assert.strictEqual(focusModel.profiles[0].id, 'aws');
    assert.strictEqual(focusModel.profiles[0].regions.length, 1);
    assert.strictEqual(focusModel.profiles[0].regions[0].id, 'ap-southeast-2');
    assert.strictEqual(focusModel.profiles[0].regions[0].services.length, 0);
  });

  test('should call listStackResources with the correct stack ARN', async () => {
    const cfnStack = new CfnStackModel('aws', mockCloudFormationStackArn);
    const listStateResourcesStub = sinon.stub(CloudFormation, 'listStackResources').resolves(mockListStackResources);

    const focusModel = await cfnStack.toFocusModel();

    assert.ok(listStateResourcesStub.calledOnceWithExactly('aws', mockCloudFormationStackArn));
  });

  test('should generate the correct service list from the CloudFormation resource list', async () => {
    const cfnStack = new CfnStackModel('aws', mockCloudFormationStackArn);
    sinon.stub(CloudFormation, 'listStackResources').resolves(mockListStackResources);

    const focusModel = await cfnStack.toFocusModel();

    const services = focusModel.profiles[0].regions[0].services;
    assert.strictEqual(services.length, 3);

    /* first service is IAM, which has a role */
    assert.deepStrictEqual(services[0], {
      id: 'iam',
      resourcetypes: [
        {
          id: 'role',
          arns: [ 'arn:aws:iam:ap-southeast-2:000000000000:role/sqs-lambda-stack-ProcessorFunctionRole-Y5z4ROokNnzm']
        }
      ]
    });

    /* second service is Lambda, which has a function and an event-source-mapping */
    assert.deepStrictEqual(services[1], {
      id: 'lambda',
      resourcetypes: [
        {
          id: 'function',
          arns: [ 'arn:aws:lambda:ap-southeast-2:000000000000:function:sqs-lambda-stack-ProcessorFunction-HRaXXljiO96B']
        },
        {
          id: 'event-source-mapping',
          arns: [ 'arn:aws:lambda:ap-southeast-2:000000000000:event-source-mapping:91edff81-dd21-4bb6-bd38-776153ec2d50']
        }
      ]
    });

    /* third service is SQS, which has two queues */
    assert.deepStrictEqual(services[2], {
      id: 'sqs',
      resourcetypes: [
        {
          id: 'queue',
          arns: [
            'arn:aws:sqs:ap-southeast-2:000000000000:sqs-lambda-stack-ProcessingDLQ-I5zmIEbmTJBk',
            'arn:aws:sqs:ap-southeast-2:000000000000:sqs-lambda-stack-ProcessingQueue-75nQhRWPuhMN'
          ]
        }
      ]
    });
  });
});
