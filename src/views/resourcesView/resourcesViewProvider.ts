
import * as vscode from 'vscode';

class ResourceTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Provider for a view that shows all the profile/region/service/resource information
 * that is in focus
 */
export class ResourceViewProvider implements vscode.TreeDataProvider<ResourceTreeItem> {
    onDidChangeTreeData?: vscode.Event<any> | undefined;

    getTreeItem(element: ResourceTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.resolve([]);
    }

    getParent?(element: ResourceTreeItem) {
        return null;
    }
    
    resolveTreeItem?(item: vscode.TreeItem, element: ResourceTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }
}