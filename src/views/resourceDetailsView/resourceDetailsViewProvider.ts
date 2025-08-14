
import * as vscode from 'vscode';

class ResourceDetailsTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Provider for a view showing the details of the AWS resource that is currently selected
 * in the "Resources" view. The content of this view will change whenever a new AWS resource
 * is selected.
 */
export class ResourceDetailsViewProvider implements vscode.TreeDataProvider<ResourceDetailsTreeItem> {
    onDidChangeTreeData?: vscode.Event<any> | undefined;

    getTreeItem(element: ResourceDetailsTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<ResourceDetailsTreeItem[]> {
        return Promise.resolve([]);
    }

    getParent?(element: ResourceDetailsTreeItem) {
        return null;
    }

    resolveTreeItem?(item: vscode.TreeItem, element: ResourceDetailsTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }
}