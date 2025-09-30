
import * as vscode from 'vscode';
import {
    CloudFormationFocusTreeItem,
    CloudFormationProfileTreeItem,
    FiltersFocusTreeItem,
    FocusErrorTreeItem,
    FocusTreeItem,
    SingleFocusTreeItem,
    WorkspaceFocusTreeItem
} from './treeItems';
import AWSConfig  from '../../models/awsConfig';
import { STS } from '../../awsClients/sts';
import { IAM } from '../../awsClients/iam';
import { Focus, loadStandardModel, StandardModel } from '../../models/focusModel';

/**
 * Provider for a view allowing the user to focus on what they want to see in the "Resources"
 * view. By selecting one of the items in this tree, the Resources view will update to
 * focus on the selected profiles/regions/services/resources.
 */
export class FocusViewProvider implements vscode.TreeDataProvider<FocusTreeItem> {

    constructor(private context: vscode.ExtensionContext) {
        
    }

    /** Get the tree item for the given element */
    public getTreeItem(element: FocusTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    /**
     * Get the child elements for the given parent element. This view has a complex nesting of different types
     * of data, so we use the exact type of each element to determine what children to return.
     */
    public getChildren(element?: any): Thenable<FocusTreeItem[]> {
        if (!element) {
            return Promise.resolve([
                new FiltersFocusTreeItem('Filters', vscode.TreeItemCollapsibleState.Collapsed),
                new CloudFormationFocusTreeItem('CloudFormation Stacks', vscode.TreeItemCollapsibleState.Collapsed),
                new WorkspaceFocusTreeItem('Workspace IaC', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        } else if (element instanceof FiltersFocusTreeItem) {
            return this.makeFocusFilterItems();
        } else if (element instanceof CloudFormationFocusTreeItem) {
            return this.makeFocusCloudFormationItems();
        } else if (element instanceof WorkspaceFocusTreeItem) {
            return this.makeFocusWorkspaceItems();
        }
        return Promise.resolve([]);
    }

    private makeFocusFilterItems(): Thenable<FocusTreeItem[]> {
        return Promise.resolve(StandardModel.all.map(model => {
            return new SingleFocusTreeItem(model.name, () => Promise.resolve(loadStandardModel(model, this.context.extensionPath)));
        }));
    }

    private makeFocusCloudFormationItems(): Thenable<FocusTreeItem[]> {
        const profiles = AWSConfig.getProfileNames();
        return Promise.all(
            profiles.map(profileName => {
                return Promise.all([
                    STS.getCallerIdentity(profileName),
                    IAM.getAccountAlias(profileName)
                ]).then(([{ account }, alias]) => {
                    return new CloudFormationProfileTreeItem(profileName, account, alias);
                }).catch((error) => {
                    /* error communicating with AWS, possibly bad credentials */
                    return new FocusErrorTreeItem(`Invalid Profile: ${profileName}. ${error}`);
                });
            })
        );
    }

    private makeFocusWorkspaceItems(): Thenable<FocusTreeItem[]> {
        throw new Error('Method not implemented.');
    }
    
    public getParent?(element: FocusTreeItem) {
        return null;
    }

    public resolveTreeItem?(item: vscode.TreeItem, element: FocusTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

    /**
     * When the user selects an item in the Focus view, return the corresponding Focus object.
     * // TODO: support multiple selection
     */
    public async getFocusFromSelection(selection: readonly FocusTreeItem[]): Promise<Focus | undefined> {
        if (selection.length === 0) {
            return undefined;
        }
        const selectedItem = selection[0];
        if (selectedItem instanceof SingleFocusTreeItem) {
            return selectedItem.getFocus();
        };
        return undefined;
    };
}