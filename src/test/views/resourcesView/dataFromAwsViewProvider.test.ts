import { ExtensionContext } from "vscode";
import * as sinon from 'sinon';
import assert from 'assert';

import { ResourceViewProvider } from "../../../views/resourcesView/viewProvider";
import { Focus, loadStandardModel, StandardModel } from "../../../models/focusModel";
import { ProviderFactory } from "../../../services/providerFactory";
import { ResourceErrorTreeItem, ResourceProfileTreeItem, ResourceRegionTreeItem, ResourceServiceTreeItem } from "../../../views/resourcesView/treeItems";
import { IAM } from "../../../awsClients/iam";
import { STS } from "../../../awsClients/sts";
import { Account } from "../../../awsClients/account";
import { readFocusModelFromResourceFile } from "../../utils";

suite('Fetching data from AWS', () => {
  let focusEveryThingWildcard: Focus;
  let focusFixedServices: Focus;
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
    ProviderFactory.initialize(mockExtensionContext);

    /* avoiding calling AWS for account data */
    getCallerIdentityStub = sinon.stub(STS, 'getCallerIdentity');
    getAccountAliasStub = sinon.stub(IAM, 'getAccountAlias');
    listRegionsStub = sinon.stub(Account, 'listRegions');
    supportedServicesStub = sinon.stub(ProviderFactory, 'getSupportedServices');
  });

  suiteTeardown(() => {
    getCallerIdentityStub.restore();
    getAccountAliasStub.restore();
    listRegionsStub.restore();
    supportedServicesStub.restore();
  });

  test('Profile data is correctly fetched', async () => {
    const viewProvider = new ResourceViewProvider(focusEveryThingWildcard, mockExtensionContext);

    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));
    getAccountAliasStub.returns(Promise.resolve('staging'));

    const profiles = await viewProvider.getChildren(undefined);

    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceProfileTreeItem);
    assert.strictEqual(profile.description, '(112233445566 - staging)');
  });

  test('Profile data is reported as an error when account identity is unavailable', async () => {
    const viewProvider = new ResourceViewProvider(focusEveryThingWildcard, mockExtensionContext);

    getCallerIdentityStub.returns(Promise.reject(new Error('Failed to get caller identity')));
    getAccountAliasStub.returns(Promise.resolve('staging'));

    const profiles = await viewProvider.getChildren(undefined);

    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceErrorTreeItem);
    assert.strictEqual(profile.label, 'Error: Invalid Profile: default. Error: Failed to get caller identity');
  });

  test('Profile data is reported as an error when account alias is unavailable', async () => {
    const viewProvider = new ResourceViewProvider(focusEveryThingWildcard, mockExtensionContext);

    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));
    getAccountAliasStub.returns(Promise.reject(new Error('Failed to get account alias')));

    const profiles = await viewProvider.getChildren(undefined);

    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceErrorTreeItem);
    assert.strictEqual(profile.label, 'Error: Invalid Profile: default. Error: Failed to get account alias');
  });

  test('Region data is correctly fetched for wildcard regions', async () => {
    const viewProvider = new ResourceViewProvider(focusEveryThingWildcard, mockExtensionContext);

    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));
    getAccountAliasStub.returns(Promise.resolve('staging'));
    listRegionsStub.returns(Promise.resolve(['ca-west-1', 'us-east-1', 'us-west-2']));

    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const regions = await viewProvider.getChildren(profiles[0]);
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
    const viewProvider = new ResourceViewProvider(focusFixedServices, mockExtensionContext);

    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));
    getAccountAliasStub.returns(Promise.resolve('staging'));
    listRegionsStub.returns(Promise.resolve(['ca-west-1', 'us-east-1', 'us-west-2']));

    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const regions = await viewProvider.getChildren(profiles[0]);
    assert.ok(regions);
    assert.strictEqual(regions.length, 3);

    for (const region of regions) {
      const services = await viewProvider.getChildren(region);
      assert.ok(services);
      assert.strictEqual(services.length, 1); // states
      assert.ok(services[0] instanceof ResourceServiceTreeItem);
      assert.strictEqual(services[0].label, 'Step Functions');
    }
  });

  test('With a wildcard service list, all services (and resource types) are returned', async () => {
    const viewProvider = new ResourceViewProvider(focusEveryThingWildcard, mockExtensionContext);

    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));
    getAccountAliasStub.returns(Promise.resolve('staging'));
    listRegionsStub.returns(Promise.resolve(['ca-west-1', 'us-east-1', 'us-west-2']));
    supportedServicesStub.returns([
      { getId: () => 'states', getName: () => 'Step Functions', getResourceTypes: () => ['activity', 'statemachine'] },
      { getId: () => 'lambda', getName: () => 'Lambda', getResourceTypes: () => ['function'] }
    ]);

    const profiles = await viewProvider.getChildren(undefined);
    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const regions = await viewProvider.getChildren(profiles[0]);
    assert.ok(regions);
    assert.strictEqual(regions.length, 3);

    const region = regions[0]; // ca-west-1
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
});