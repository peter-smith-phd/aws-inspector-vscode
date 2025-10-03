
import * as vscode from 'vscode';
import {
    FocusCfnTopLevelTreeItem,
    FocusCfnProfileTreeItem,
    FocusFiltersTopLevelTreeItem,
    FocusErrorTreeItem,
    FocusTreeItem,
    FocusSelectableTreeItem,
    FocusWorkspaceTopLevelTreeItem,
    FocusCfnRegionTreeItem,
    FocusPlaceholderTreeItem
} from './treeItems';
import AWSConfig  from '../../models/awsConfig';
import { STS } from '../../awsClients/sts';
import { IAM } from '../../awsClients/iam';
import { Focus, loadStandardModel, StandardModel } from '../../models/focusModel';
import { Account } from '../../awsClients/account';
import { getRegionLongName } from '../../models/regionModel';
import { CloudFormation } from '../../awsClients/cloudformation';

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
                new FocusFiltersTopLevelTreeItem('Filters', vscode.TreeItemCollapsibleState.Collapsed),
                new FocusCfnTopLevelTreeItem('CloudFormation Stacks', vscode.TreeItemCollapsibleState.Collapsed),
                new FocusWorkspaceTopLevelTreeItem('Workspace IaC', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        } else if (element instanceof FocusFiltersTopLevelTreeItem) {
            return this.makeFocusFiltersSelectableTreeItems();
        } else if (element instanceof FocusCfnTopLevelTreeItem) {
            return this.makeFocusCfnProfileTreeItems();
        } else if (element instanceof FocusCfnProfileTreeItem) {
            return this.makeFocusCfnRegionTreeItems(element);
        } else if (element instanceof FocusCfnRegionTreeItem) {
            return this.makeFocusCfnSelectableTreeItems(element);
        } else if (element instanceof FocusWorkspaceTopLevelTreeItem) {
            return this.makeFocusWorkspaceTreeItems();
        }
        return Promise.resolve([]);
    }

    /**
     * Make selectable tree items for all the standard focus models.
     */
    private makeFocusFiltersSelectableTreeItems(): Thenable<FocusTreeItem[]> {
        return Promise.resolve(StandardModel.all.map(model => {
            return new FocusSelectableTreeItem(model.name, () => Promise.resolve(loadStandardModel(model, this.context.extensionPath)));
        }));
    }

    /**
     * Make a list of tree items representing the Profiles that will have CloudFormation stacks in them.
     */
    private makeFocusCfnProfileTreeItems(): Thenable<FocusTreeItem[]> {
        const profiles = AWSConfig.getProfileNames();
        return Promise.all(
            profiles.map(profileName => {
                return Promise.all([
                    STS.getCallerIdentity(profileName),
                    IAM.getAccountAlias(profileName)
                ]).then(([{ account }, alias]) => {
                    return new FocusCfnProfileTreeItem(profileName, account, alias);
                }).catch((error) => {
                    /* error communicating with AWS, possibly bad credentials */
                    return new FocusErrorTreeItem(`Invalid Profile: ${profileName}. ${error}`);
                });
            })
        );
    }

    /**
     * Make a list of tree items representing the Regions that have CloudFormation stacks in them,
     * for the given profile.
     */
    private makeFocusCfnRegionTreeItems(parent: FocusCfnProfileTreeItem): Thenable<FocusTreeItem[]> {
        return Account.listRegions(parent.profileName).then(regions => {
            return regions.map(regionName => {
                return new FocusCfnRegionTreeItem(parent.profileName, regionName, getRegionLongName(regionName));
            });
        });
    }

    /**
     * Make selectable tree items for all the CloudFormation stacks in the given region/profile.
     */
    private makeFocusCfnSelectableTreeItems(parent: FocusCfnRegionTreeItem): Thenable<FocusTreeItem[]> {
        return CloudFormation.listStacks(parent.profileName, parent.regionName).then(stacks => {
            if (stacks.length === 0) {
                return [ new FocusPlaceholderTreeItem('[ No stacks ]') ];
            }
            return stacks.map(stack => {
                // TODO: compute the actual focus for this stack
                return new FocusSelectableTreeItem(stack.StackName!, () => {
                    console.log(`Loading focus for stack ${stack.StackName}`);
                    return Promise.resolve(undefined) as unknown as Promise<Focus>;
                });
            });
        });
    }

    /**
     * Make tree items for all the IaC defined in the current workspace.
     */
    private makeFocusWorkspaceTreeItems(): Thenable<FocusTreeItem[]> {
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
        if (selectedItem instanceof FocusSelectableTreeItem) {
            return selectedItem.getFocus();
        };
        return undefined;
    };
}