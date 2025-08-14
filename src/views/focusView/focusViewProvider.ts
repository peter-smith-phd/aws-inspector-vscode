
import * as vscode from 'vscode';

class FocusTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Provider for a view allowing the user to focus on what they want to see in the "Resources"
 * view. By selecting one of the items in this tree, the Resources view will update to
 * focus on the selected profiles/regions/services/resources.
 */
export class FocusViewProvider implements vscode.TreeDataProvider<FocusTreeItem> {
    onDidChangeTreeData?: vscode.Event<any> | undefined;

    getTreeItem(element: FocusTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: any): Thenable<FocusTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve([
                new FocusTreeItem('Profile: aws (728371273723 - staging)'),
                new FocusTreeItem('Resource Filters', vscode.TreeItemCollapsibleState.Collapsed),
                new FocusTreeItem('CloudFormation Stacks', vscode.TreeItemCollapsibleState.Collapsed),
                new FocusTreeItem('IaC in Workspace', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }
    }

    getParent?(element: FocusTreeItem) {
        return null;
    }

    resolveTreeItem?(item: vscode.TreeItem, element: FocusTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }
}