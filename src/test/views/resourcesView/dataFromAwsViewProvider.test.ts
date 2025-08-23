import { ExtensionContext } from "vscode";
import * as sinon from 'sinon';
import assert from 'assert';

import { ResourceViewProvider } from "../../../views/resourcesView/viewProvider";
import { Focus, loadStandardModel, StandardModel } from "../../../models/focusModel";
import { ProviderFactory } from "../../../services/providerFactory";
import { ResourceErrorTreeItem, ResourceProfileTreeItem } from "../../../views/resourcesView/treeItems";
import { IAM } from "../../../awsClients/iam";
import { STS } from "../../../awsClients/sts";

suite('Fetching data from AWS', () => {
  let viewProvider: ResourceViewProvider;
  let getCallerIdentityStub: sinon.SinonStub;
  let getAccountAliasStub: sinon.SinonStub;

  const mockExtensionContext = {
    extensionPath: '/mock-path'
  } as unknown as ExtensionContext;

  suiteSetup(() => {
    const focus: Focus = loadStandardModel(StandardModel.EVERYTHING_IN_DEFAULT_PROFILE);
    viewProvider = new ResourceViewProvider(focus, mockExtensionContext);
    ProviderFactory.initialize(mockExtensionContext);

    /* avoiding calling AWS for account data */
    getCallerIdentityStub = sinon.stub(STS, 'getCallerIdentity');
    getAccountAliasStub = sinon.stub(IAM, 'getAccountAlias');
  });

  suiteTeardown(() => {
    getCallerIdentityStub.restore();
    getAccountAliasStub.restore();
  });

  test('Profile data is correctly fetched', async () => {
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
    getCallerIdentityStub.returns(Promise.resolve({ account: '112233445566' }));
    getAccountAliasStub.returns(Promise.reject(new Error('Failed to get account alias')));

    const profiles = await viewProvider.getChildren(undefined);

    assert.ok(profiles);
    assert.strictEqual(profiles.length, 1);

    const profile = profiles[0];
    assert.ok(profile instanceof ResourceErrorTreeItem);
    assert.strictEqual(profile.label, 'Error: Invalid Profile: default. Error: Failed to get account alias');
  });
});