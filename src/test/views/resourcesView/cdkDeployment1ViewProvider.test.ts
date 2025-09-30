import { Focus } from '../../../models/focusModel';
import assert from 'assert';
import sinon from 'sinon';

import { readFocusModelFromResourceFile } from '../../utils';
import { ResourceViewProvider } from '../../../views/resourcesView/viewProvider';
import { ExtensionContext } from 'vscode';
import { ResourceArnTreeItem, ResourceProfileTreeItem, ResourceRegionTreeItem, ResourceServiceTreeItem, ResourceTypeTreeItem } from '../../../views/resourcesView/treeItems';
import { ProviderFactory } from '../../../services/providerFactory';
import { STS } from '../../../awsClients/sts';
import { IAM } from '../../../awsClients/iam';

suite('CDK Deployment 1 view provider', () => {
  let viewProvider: ResourceViewProvider;
  let getCallerIdentityStub: sinon.SinonStub;
  let getAccountAliasStub: sinon.SinonStub;

  const mockExtensionContext = {
    extensionPath: '/mock-path'
  } as unknown as ExtensionContext;

  suiteSetup(() => {
    const focus: Focus = readFocusModelFromResourceFile('mock-cdk-deployment-1.focus.json');
    viewProvider = new ResourceViewProvider(mockExtensionContext);
    viewProvider.setFocus(focus);
    ProviderFactory.initialize(mockExtensionContext);

    /* avoiding calling AWS for account data */
    getCallerIdentityStub = sinon.stub(STS, 'getCallerIdentity');
    getCallerIdentityStub.returns(Promise.resolve({ account: '123412341234' }));
    getAccountAliasStub = sinon.stub(IAM, 'getAccountAlias');
    getAccountAliasStub.returns(Promise.resolve('staging'));
  });

  suiteTeardown(() => {
    getCallerIdentityStub.restore();
    getAccountAliasStub.restore();
  });

  test('getChildren() on the root returns a single ResourceProfileTreeItem', async () => {
    const profiles = await viewProvider.getChildren(undefined); // Profile: aws

    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const node = profiles[0];
    assert.ok(node instanceof ResourceProfileTreeItem);
    assert.strictEqual(node.label, 'Profile: aws');
    assert.strictEqual(node.description, '(123412341234 - staging)');
  });

  test('getChildren() on the ResourceProfileTreeItem returns the correct ResourceRegionTreeItems', async () => {
    const profiles = await viewProvider.getChildren(undefined) as ResourceProfileTreeItem[]; // Profile: aws
    const regions = await viewProvider.getChildren(profiles[0]); // us-east-1, ap-southeast-2

    assert.ok(regions);
    assert.strictEqual(regions.length, 2);
    assert.ok(regions[0] instanceof ResourceRegionTreeItem);
    assert.strictEqual(regions[0].label, 'us-east-1');
    assert.ok(regions[1] instanceof ResourceRegionTreeItem);
    assert.strictEqual(regions[1].label, 'ap-southeast-2');
  });

  test('getChildren() on the ResourceRegionTreeItems returns the correct ResourceServiceTreeItems', async () => {
    const profiles = await viewProvider.getChildren(undefined) as ResourceProfileTreeItem[]; // Profile: aws
    const regions = await viewProvider.getChildren(profiles[0]) as ResourceRegionTreeItem[]; // us-east-1, ap-southeast-2
    const services = await viewProvider.getChildren(regions[0]); // Lambda, Step Functions

    assert.ok(services);
    assert.strictEqual(services.length, 2);
    assert.ok(services[0] instanceof ResourceServiceTreeItem);
    assert.strictEqual(services[0].label, 'Lambda');
    assert.ok(services[1] instanceof ResourceServiceTreeItem);
    assert.strictEqual(services[1].label, 'Step Functions');
  });

  test('getChildren() on the ResourceServiceTreeItems returns the correct ResourceTypeTreeItem', async () => {
    const profiles = await viewProvider.getChildren(undefined) as ResourceProfileTreeItem[]; // Profile: aws
    const regions = await viewProvider.getChildren(profiles[0]) as ResourceRegionTreeItem[]; // us-east-1, ap-southeast-2
    const services = await viewProvider.getChildren(regions[0]) as ResourceServiceTreeItem[]; // Lambda, Step Functions
    const types = await viewProvider.getChildren(services[1]); // Activities, State Machines

    assert.ok(types);
    assert.strictEqual(types.length, 2);
    assert.ok(types[0] instanceof ResourceTypeTreeItem);
    assert.strictEqual(types[0].label, 'Activities');
    assert.ok(types[1] instanceof ResourceTypeTreeItem);
    assert.strictEqual(types[1].label, 'State Machines');
  });

  test('getChildren() on the ResourceTypeTreeItems returns an array of ARNs', async () => {
    const profiles = await viewProvider.getChildren(undefined) as ResourceProfileTreeItem[]; // Profile: aws
    const regions = await viewProvider.getChildren(profiles[0]) as ResourceRegionTreeItem[]; // us-east-1, ap-southeast-2
    const services = await viewProvider.getChildren(regions[0]) as ResourceServiceTreeItem[]; // Lambda, Step Functions
    const types = await viewProvider.getChildren(services[1]) as ResourceTypeTreeItem[]; // Activities, State Machines
    const arns = await viewProvider.getChildren(types[1]); // State Machines

    assert.ok(arns);
    assert.strictEqual(arns.length, 3);

    for (const i of [0, 1, 2]) {
      assert.ok(arns[i] instanceof ResourceArnTreeItem);
      assert.strictEqual(arns[i].label, `stateMachine${i + 1}`);
      assert.strictEqual(arns[i].arn, `arn:aws:states:us-east-1:123412341234:stateMachine:stateMachine${i + 1}`);
      assert.strictEqual(arns[i].tooltip, 'Step Functions State Machine');
      assert.strictEqual(arns[i].iconPath, '/mock-path/resources/icons/services/states.svg');
    }
  });
});