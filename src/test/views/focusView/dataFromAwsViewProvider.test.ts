import assert from "assert";
import * as sinon from 'sinon';
import { FocusViewProvider } from "../../../views/focusView/viewProvider";
import { FocusCfnProfileTreeItem, FocusCfnRegionTreeItem, FocusCfnTopLevelTreeItem, FocusFiltersTopLevelTreeItem, FocusSelectableTreeItem, FocusWorkspaceTopLevelTreeItem } from "../../../views/focusView/treeItems";
import AWSConfig from "../../../models/awsConfig";
import { STS } from "../../../awsClients/sts";
import { IAM } from "../../../awsClients/iam";
import { Account } from "../../../awsClients/account";
import { CloudFormation } from "../../../awsClients/cloudformation";

suite('Focus view with mocked data from AWS', function () {
  
  const mockContext: any = {
    extensionPath: ''
  };

  setup(() => {
    sinon.stub(AWSConfig, 'getProfileNames').returns(['default', 'production']);
    sinon.stub(STS, 'getCallerIdentity').returns(Promise.resolve({ account: '112233445566' }));
    sinon.stub(IAM, 'getAccountAlias').returns(Promise.resolve('myAlias'));
    sinon.stub(Account, 'listRegions').returns(Promise.resolve(['ca-west-1', 'us-east-1', 'us-west-2']));
    sinon.stub(CloudFormation, 'listStacks').returns(Promise.resolve([
      { 
        StackName: 'test-stack',
        StackId: 'arn:aws:cloudformation:ca-west-1:112233445566:stack/test-stack/abcd1234',
        CreationTime: new Date(),
        StackStatus: 'CREATE_COMPLETE'
      }
    ])); 
  });

  teardown(() => {
    sinon.restore();
  });

  test('Correct top-level tree items', async function () {
    const provider = new FocusViewProvider(mockContext);
    const items = await provider.getChildren(undefined);

    assert.strictEqual(items.length, 3);
    assert.ok(items[0] instanceof FocusFiltersTopLevelTreeItem);
    assert.ok(items[1] instanceof FocusCfnTopLevelTreeItem);
    assert.ok(items[2] instanceof FocusWorkspaceTopLevelTreeItem);
  });

  test('Filters top-level tree item has at least 3 children', async function () {
    const provider = new FocusViewProvider(mockContext);
    const items = await provider.getChildren(undefined);
    const filtersItem = items[0];
    const filterChildren = await provider.getChildren(filtersItem);

    assert.ok(filterChildren.length >= 3);
    assert(filterChildren[0] instanceof FocusSelectableTreeItem);
    assert.strictEqual(filterChildren[0].label, 'All Services in Default Region');
    assert(filterChildren[1] instanceof FocusSelectableTreeItem);
    assert.strictEqual(filterChildren[1].label, 'All Regions in Default Profile');
    assert(filterChildren[2] instanceof FocusSelectableTreeItem);
    assert.strictEqual(filterChildren[2].label, 'Everything in all Profiles');
  });

  test('The CloudFormation top-level tree item has profiles as children', async function () {    
    const provider = new FocusViewProvider(mockContext);
    const items = await provider.getChildren(undefined);
    const cfnItem = items[1];
    const cfnChildren = await provider.getChildren(cfnItem);

    /* there should be two profiles */
    assert.strictEqual(cfnChildren.length, 2);
    assert(cfnChildren[0] instanceof FocusCfnProfileTreeItem);
    assert.strictEqual(cfnChildren[0].label, 'Profile: default');
    assert.strictEqual(cfnChildren[0].description, '(112233445566 - myAlias)');
    assert(cfnChildren[1] instanceof FocusCfnProfileTreeItem);
    assert.strictEqual(cfnChildren[1].label, 'Profile: production');
    assert.strictEqual(cfnChildren[1].description, '(112233445566 - myAlias)');
  });

  test('The CloudFormation profile tree item has regions as children', async function () {
    const provider = new FocusViewProvider(mockContext);
    const items = await provider.getChildren(undefined);
    const cfnItem = items[1];
    const cfnChildren = await provider.getChildren(cfnItem);
    const profileItem = cfnChildren[0];
    const regionChildren = await provider.getChildren(profileItem);

    /* there should be three regions */
    assert.strictEqual(regionChildren.length, 3);
    assert(regionChildren[0] instanceof FocusCfnRegionTreeItem);
    assert.strictEqual(regionChildren[0].label, 'ca-west-1');
    assert(regionChildren[1] instanceof FocusCfnRegionTreeItem);
    assert.strictEqual(regionChildren[1].label, 'us-east-1');
    assert(regionChildren[2] instanceof FocusCfnRegionTreeItem);
    assert.strictEqual(regionChildren[2].label, 'us-west-2');
  });

  test('The CloudFormation regions have CloudFormation stacks as children', async function () {
    const provider = new FocusViewProvider(mockContext);
    const items = await provider.getChildren(undefined);
    const cfnItem = items[1];
    const cfnChildren = await provider.getChildren(cfnItem);
    const profileItem = cfnChildren[0];
    const regionChildren = await provider.getChildren(profileItem);
    const regionItem = regionChildren[0];
    const stackChildren = await provider.getChildren(regionItem);

    /* there should be one stack */
    assert.strictEqual(stackChildren.length, 1);
    assert(stackChildren[0] instanceof FocusSelectableTreeItem);
    assert.strictEqual(stackChildren[0].label, 'test-stack');
  });
});