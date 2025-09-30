import assert from "assert";
import sinon from "sinon";
import { States } from "../../../awsClients/states";
import { ResourceDetailsViewProvider } from "../../../views/resourceDetailsView/viewProvider";
import { assertExpectedResourceDetailsTreeItems } from "./utils";
import { ProviderFactory } from "../../../services/providerFactory";
import { ExtensionContext } from "vscode";

suite('Step Functions resource details', function () {
  let describeActivityStub: sinon.SinonStub;
  let describeStateMachineStub: sinon.SinonStub;
  
  const mockExtensionContext = {
    extensionPath: '/mock-path'
  } as unknown as ExtensionContext;

  setup(function () {
    ProviderFactory.initialize(mockExtensionContext);
    describeActivityStub = sinon.stub(States, 'describeActivity');
    describeStateMachineStub = sinon.stub(States, 'describeStateMachine');
  });

  teardown(function () {
    sinon.restore();
  });

  test('Activity details are correct', async function () {
    describeActivityStub.resolves({
      activityArn: 'arn:aws:states:us-west-1:123456789012:activity:my-activity',
      name: 'my-activity',
      creationDate: new Date('2023-10-01T12:00:00Z')
    });

    const provider = new ResourceDetailsViewProvider();
    provider.setArn('default', 'arn:aws:states:us-west-1:123456789012:activity:my-activity');

    const items = await provider.getChildren();
    assertExpectedResourceDetailsTreeItems(items!, [
      { name: 'ARN', value: 'arn:aws:states:us-west-1:123456789012:activity:my-activity' },
      { name: 'Service', value: 'Step Functions' },
      { name: 'Resource Type', value: 'Activity' },
      { name: 'Name', value: 'my-activity' },
      { name: 'Creation Date', value: '2023-10-01T12:00:00.000Z' }
    ]);

    assert.ok(describeActivityStub.calledOnceWithExactly('default', 'us-west-1', 'arn:aws:states:us-west-1:123456789012:activity:my-activity'));
  });

  test('State Machine details are correct', async function () {
    describeStateMachineStub.resolves({
      stateMachineArn: 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:HelloWorldStateMachine',
      name: 'HelloWorldStateMachine',
      status: 'ACTIVE',
      definition: '{}',
      roleArn: 'arn:aws:iam::123456789012:role/service-role/StepFunctions-HelloWorldStateMachine-role-7z9742adb',
      type: 'STANDARD',
      creationDate: new Date('2025-03-10T06:59:40.263Z'),
      loggingConfiguration: {
        level: 'ERROR',
        includeExecutionData: true,
        destinations: [
          {
            cloudWatchLogsLogGroup: {
              logGroupArn: 'arn:aws:logs:ap-southeast-2:123456789012:log-group:/aws/vendedlogs/states/MyStateMachine-Logs:*'
            }
          }
        ]
      },
      tracingConfiguration: {
        enabled: true
      },
      revisionId: 'a8bc8df5-a651-4ce1-b421-af0794b7761f',
      encryptionConfiguration: {
        type: 'AWS_OWNED_KEY'
      },
      variableReferences: {
        'Set Checkpoint': [
          'CheckpointCount'
        ],
        'Summarize the Execution': [
          'CheckpointCount'
        ],
        'Wait for X Seconds': [
          'CheckpointCount'
        ]
      }
    });

    const provider = new ResourceDetailsViewProvider();
    provider.setArn('default', 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:HelloWorldStateMachine');

    const items = await provider.getChildren();
    assertExpectedResourceDetailsTreeItems(items!, [
      { name: 'ARN', value: 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:HelloWorldStateMachine' },
      { name: 'Service', value: 'Step Functions' },
      { name: 'Resource Type', value: 'State Machine' },
      { name: 'Name', value: 'HelloWorldStateMachine' },
      { name: 'Description', value: '' },
      { name: 'State Machine Type', value: 'STANDARD' },
      { name: 'Status', value: 'ACTIVE' },
      { name: 'Creation Date', value: '2025-03-10T06:59:40.263Z' },
      { name: 'Role ARN', value: 'arn:aws:iam::123456789012:role/service-role/StepFunctions-HelloWorldStateMachine-role-7z9742adb' },
      { name: 'Definition', value: '{}' },
      { name: 'Log Group', value: 'arn:aws:logs:ap-southeast-2:123456789012:log-group:/aws/vendedlogs/states/MyStateMachine-Logs:*' },
      { name: 'Log Execution Data', value: 'Yes' },
      { name: 'Log Level', value: 'ERROR' },
      { name: 'Tracing', value: 'Enabled' }
    ]);

    assert.ok(describeStateMachineStub.calledOnceWithExactly('default', 'ap-southeast-2', 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:HelloWorldStateMachine'));
  });

  test('State Machine details with only mandatory fields are correct', async function () {
    describeStateMachineStub.resolves({
      stateMachineArn: 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:TestStateMachine',
      name: 'TestStateMachine',
      status: 'ACTIVE',
      definition: '{}',
      roleArn: 'arn:aws:iam::123456789012:role/service-role/StepFunctions-TestStateMachine-role-a21sngksk',
      type: 'STANDARD',
      creationDate: new Date('2025-07-29T13:23:34.031Z'),
      loggingConfiguration: {
        level: 'OFF',
        includeExecutionData: false
      },
      tracingConfiguration: {
        enabled: false
      },
      encryptionConfiguration: {
        type: 'AWS_OWNED_KEY'
      }
    });

    const provider = new ResourceDetailsViewProvider();
    provider.setArn('default', 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:TestStateMachine');

    const items = await provider.getChildren();
    assertExpectedResourceDetailsTreeItems(items!, [
      { name: 'ARN', value: 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:TestStateMachine' },
      { name: 'Service', value: 'Step Functions' },
      { name: 'Resource Type', value: 'State Machine' },
      { name: 'Name', value: 'TestStateMachine' },
      { name: 'Description', value: '' },
      { name: 'State Machine Type', value: 'STANDARD' },
      { name: 'Status', value: 'ACTIVE' },
      { name: 'Creation Date', value: '2025-07-29T13:23:34.031Z' },
      { name: 'Role ARN', value: 'arn:aws:iam::123456789012:role/service-role/StepFunctions-TestStateMachine-role-a21sngksk' },
      { name: 'Definition', value: '{}' },
      { name: 'Log Group', value: 'None' },
      { name: 'Log Execution Data', value: 'No' },
      { name: 'Log Level', value: 'OFF' },
      { name: 'Tracing', value: 'Disabled' }
    ]);

    assert.ok(describeStateMachineStub.calledOnceWithExactly('default', 'ap-southeast-2', 'arn:aws:states:ap-southeast-2:123456789012:stateMachine:TestStateMachine'));
  });
});