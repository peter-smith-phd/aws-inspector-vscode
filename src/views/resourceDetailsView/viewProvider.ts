
import * as vscode from 'vscode';

class ResourceDetailsTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, public readonly value: string) {
        super(label);
        this.description = value;
        this.tooltip = value;
    }
}

/**
 * Provider for a view showing the details of the AWS resource that is currently selected
 * in the "Resources" view. The content of this view will change whenever a new AWS resource
 * is selected.
 */
export class ResourceDetailsViewProvider implements vscode.TreeDataProvider<ResourceDetailsTreeItem> {

    /** EventEmitter we use to produce the event when the tree data changes. */
    private _onDidChangeTreeData = new vscode.EventEmitter<ResourceDetailsTreeItem | undefined | null | void>();

    /** The event that is fired when the tree data changes. For notifying listeners */
    public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    /** The ARN of the currently selected resource */
    private arn: string | undefined = undefined;

    /** Update the view to show details of the selected resource */
    public setArn(arn: string) {
        if (arn !== this.arn) {
            this.arn = arn;
            this._onDidChangeTreeData.fire();
        }
    }

    getTreeItem(element: ResourceDetailsTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<ResourceDetailsTreeItem[]> {
        if (this.arn) {
            // TODO: add more details here.
            return Promise.resolve([new ResourceDetailsTreeItem('ARN:', this.arn)]);
        } else {
            return Promise.resolve([new ResourceDetailsTreeItem('No resource selected', '')]);
        }
    }

    getParent?(element: ResourceDetailsTreeItem) {
        return null;
    }

    resolveTreeItem?(item: vscode.TreeItem, element: ResourceDetailsTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }
}