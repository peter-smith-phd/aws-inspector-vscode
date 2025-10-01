import { ExtensionContext } from "vscode";
import * as sinon from 'sinon';
import assert from 'assert';

import { ResourceViewProvider } from "../../../views/resourcesView/viewProvider";
import { Focus, loadStandardModel, StandardModel } from "../../../models/focusModel";
import { ProviderFactory } from "../../../services/providerFactory";
import { ResourceArnTreeItem, ResourceErrorTreeItem, ResourcePlaceholderTreeItem, ResourceProfileTreeItem, ResourceRegionTreeItem, ResourceServiceTreeItem, ResourceTypeTreeItem } from "../../../views/resourcesView/treeItems";
import { IAM } from "../../../awsClients/iam";
import { STS } from "../../../awsClients/sts";
import { Account } from "../../../awsClients/account";
import { readFocusModelFromResourceFile } from "../../utils";
import { States } from "../../../awsClients/states";
import { StateMachineType } from "@aws-sdk/client-sfn";
import AWSConfig from "../../../models/awsConfig";

suite('Fetching data from AWS', () => {
  let focusEveryThingWildcard: Focus;
  let focusFixedServices: Focus;
  let focusWildcardArns: Focus;
  let getCallerIdentityStub: sinon.SinonStub;
  let getAccountAliasStub: sinon.SinonStub;
  let listRegionsStub: sinon.SinonStub;
  let supportedServicesStub: sinon.SinonStub;

  const mockExtensionContext = {
    extensionPath: '/mock-path'
  } as unknown as ExtensionContext;

  suiteSetup(() => {
    focusEveryThingWildcard = loadStandardModel(StandardModel.EVERYTHING_IN_DEFAULT_PROFILE);
    focusFixedServices = readFocusModelFromResourceFile('mock-wildcard-regions-fixed-services.focus.json');
    focusWildcardArns = readFocusModelFromResourceFile('mock-wildcard-arns.json');

    ProviderFactory.initialize(mockExtensionContext);
  });

  setup(() => {
    getCallerIdentityStub = sinon.stub(STS, 'getCallerIdentity');
    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));

    getAccountAliasStub = sinon.stub(IAM, 'getAccountAlias');
    getAccountAliasStub.returns(Promise.resolve('staging'));

    listRegionsStub = sinon.stub(Account, 'listRegions');
    listRegionsStub.returns(Promise.resolve(['ca-west-1', 'us-east-1', 'us-west-2']));

    supportedServicesStub = sinon.stub(ProviderFactory, 'getSupportedServices');
  });

  teardown(() => {
    sinon.restore();
  });

  test('Profile data is correctly fetched', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusEveryThingWildcard);

    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceProfileTreeItem);
    assert.strictEqual(profile.description, '(112233445566 - staging)');
  });

  test('Profile data is reported as an error when account identity is unavailable', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusEveryThingWildcard);

    getCallerIdentityStub.returns(Promise.reject(new Error('Failed to get caller identity')));
    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceErrorTreeItem);
    assert.strictEqual(profile.label, 'Error: Invalid Profile: default. Error: Failed to get caller identity');
  });

  test('Profile data is reported as an error when account alias is unavailable', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusEveryThingWildcard);

    getAccountAliasStub.returns(Promise.reject(new Error('Failed to get account alias')));
    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceErrorTreeItem);
    assert.strictEqual(profile.label, 'Error: Invalid Profile: default. Error: Failed to get account alias');
  });

  test('With a wildcard profile in the focus, show all the profiles in the AWS config', async () => {
    const focusWithWildcardProfile = loadStandardModel(StandardModel.EVERYTHING_IN_ALL_PROFILES);
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusWithWildcardProfile);

    sinon.stub(AWSConfig, 'getProfileNames').returns(['default', 'staging', 'production']);

    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 3);

    const profile1 = profiles[0];
    assert.ok(profile1 instanceof ResourceProfileTreeItem);
    assert.strictEqual(profile1.label, 'Profile: default');

    const profile2 = profiles[1];
    assert.ok(profile2 instanceof ResourceProfileTreeItem);
    assert.strictEqual(profile2.label, 'Profile: staging');

    const profile3 = profiles[2];
    assert.ok(profile3 instanceof ResourceProfileTreeItem);
    assert.strictEqual(profile3.label, 'Profile: production');
  });

  test('Region data is correctly fetched for wildcard regions', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusEveryThingWildcard);

    const profiles = await viewProvider.getChildren(undefined);
    const regions = await viewProvider.getChildren(profiles![0]);

    assert.ok(regions);
    assert.strictEqual(regions.length, 3);

    assert.ok(regions[0] instanceof ResourceRegionTreeItem);
    assert.strictEqual(regions[0].label, 'ca-west-1');
    assert.ok(regions[1] instanceof ResourceRegionTreeItem);
    assert.strictEqual(regions[1].label, 'us-east-1');
    assert.ok(regions[2] instanceof ResourceRegionTreeItem);
    assert.strictEqual(regions[2].label, 'us-west-2');
  });

  test('With a wildcard region, every region has the same list of services', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusFixedServices);

    const profiles = await viewProvider.getChildren(undefined);
    const regions = await viewProvider.getChildren(profiles![0]);

    for (const region of regions!) {
      const services = await viewProvider.getChildren(region);
      assert.ok(services);
      assert.strictEqual(services.length, 1); // states
      assert.ok(services[0] instanceof ResourceServiceTreeItem);
      assert.strictEqual(services[0].label, 'Step Functions');
    }
  });

  test('With a wildcard service list, all services (and resource types) are returned', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusEveryThingWildcard);

    const profiles = await viewProvider.getChildren(undefined);
    const regions = await viewProvider.getChildren(profiles![0]);
    const region = regions![0]; // ca-west-1

    supportedServicesStub.returns([
      { getId: () => 'states', getName: () => 'Step Functions', getResourceTypes: () => ['activity', 'statemachine'] },
      { getId: () => 'lambda', getName: () => 'Lambda', getResourceTypes: () => ['function'] }
    ]);

    const services = await viewProvider.getChildren(region);
    assert.ok(services);
    assert.strictEqual(services.length, 2); // states, lambda

    const statesService = services[0];
    assert.ok(statesService instanceof ResourceServiceTreeItem);
    assert.strictEqual(statesService.label, 'Step Functions');

    const lambdaService = services[1];
    assert.ok(lambdaService instanceof ResourceServiceTreeItem);
    assert.strictEqual(lambdaService.label, 'Lambda');
  });

  test('With a wildcard ARNs list, the relevant provider functions are called', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusWildcardArns);

    const profiles = await viewProvider.getChildren(undefined);
    const regions = await viewProvider.getChildren(profiles![0]);
    const region = regions![0]; // us-west-1
    const services = await viewProvider.getChildren(region);
    const statesService = services![0]; // states

    const resourceTypes = await viewProvider.getChildren(statesService);
    assert.ok(resourceTypes);
    assert.strictEqual(resourceTypes.length, 2);
    assert.ok(resourceTypes[0] instanceof ResourceTypeTreeItem);
    assert.strictEqual(resourceTypes[0].label, 'Activities');
    assert.ok(resourceTypes[1] instanceof ResourceTypeTreeItem);
    assert.strictEqual(resourceTypes[1].label, 'State Machines');

    /* Should call States.listActivities with default/us-west-1 */
    const listActivitiesStub = sinon.stub(States, 'listActivities');
    listActivitiesStub.returns(Promise.resolve([
      {
        name: `activity-1`,
        activityArn: `arn:aws:states:us-west-1:112233445566:activity:activity-1`,
        creationDate: new Date()
      },
      {
        name: `activity-2`,
        activityArn: `arn:aws:states:us-west-1:112233445566:activity:activity-2`,
        creationDate: new Date()
      }
    ]));

    const activities = await viewProvider.getChildren(resourceTypes[0]);
    assert.ok(listActivitiesStub.calledOnceWithExactly('default', 'us-west-1'));
    assert.ok(activities);
    assert.strictEqual(activities.length, 2);
    assert.ok(activities[0] instanceof ResourceArnTreeItem);
    assert.strictEqual(activities[0].label, 'activity-1');
    assert.ok(activities[1] instanceof ResourceArnTreeItem);
    assert.strictEqual(activities[1].label, 'activity-2');

    /* Should call States.listStateMachines with default/us-west-1 */
    const listStateMachinesStub = sinon.stub(States, 'listStateMachines');
    listStateMachinesStub.returns(Promise.resolve([
      {
        name: `state-machine-1`,
        stateMachineArn: `arn:aws:states:us-west-1:112233445566:stateMachine:state-machine-1`,
        type: StateMachineType.STANDARD,
        creationDate: new Date()
      }
    ]));

    const stateMachines = await viewProvider.getChildren(resourceTypes[1]);
    assert.ok(listStateMachinesStub.calledOnceWithExactly('default', 'us-west-1'));
    assert.ok(stateMachines);
    assert.strictEqual(stateMachines.length, 1);
    assert.ok(stateMachines[0] instanceof ResourceArnTreeItem);
    assert.strictEqual(stateMachines[0].label, 'state-machine-1');
  });

  test('With a default region specified, the region from AWS_REGION is used', async () => {
    process.env.AWS_REGION = 'ca-west-1';

    const focusWithDefaultRegion = loadStandardModel(StandardModel.EVERYTHING_IN_DEFAULT_REGION);
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusWithDefaultRegion);

    const profiles = await viewProvider.getChildren(undefined);
    const regions = await viewProvider.getChildren(profiles![0]);

    assert.ok(regions);
    assert.strictEqual(regions.length, 1);

    const region = regions[0];
    assert.ok(region instanceof ResourceRegionTreeItem);
    assert.strictEqual(region.label, 'ca-west-1');

    delete process.env.AWS_REGION;
  });

  test('With no default region available in .aws/config, an error is shown', async () => {
    const focusWithDefaultRegion = loadStandardModel(StandardModel.EVERYTHING_IN_DEFAULT_REGION);
    const viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focusWithDefaultRegion);
    
    /* stub out getRegionForProfile to return undefined */
    sinon.stub(AWSConfig, 'getRegionForProfile').returns(undefined);

    const profiles = await viewProvider.getChildren(undefined);
    const regions = await viewProvider.getChildren(profiles![0]);

    assert.ok(regions);
    assert.strictEqual(regions.length, 1);

    const region = regions[0];
    assert.ok(region instanceof ResourceErrorTreeItem);
    assert.strictEqual(region.label, 'Error: Profile default does not have a default region configured.');
  });

  test('With no focus set, an error is shown', async () => {
    const viewProvider = new ResourceViewProvider(mockExtensionContext);

    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourcePlaceholderTreeItem);
    assert.strictEqual(profile.label, 'Please select a focus in the Focus view.');
  });
});