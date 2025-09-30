import * as vscode from 'vscode';
import { Focus } from '../../models/focusModel';

/**
 * Root class for all tree items in the Focus view.
 */
export class FocusTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Top-level tree item for resource filters in the Focus view.
 */
export class FiltersFocusTreeItem extends FocusTreeItem {
    constructor(label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Tree item for an individual selectable filter in the Focus view. This
 * includes standard focus models, user-defined focuses, CloudFormation stacks,
 * and IaC defined directly in the workspace.
 */
export class SingleFocusTreeItem extends FocusTreeItem {
    private selected: boolean = false;

    constructor(label: string, public getFocus: () => Promise<Focus>) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `Select to focus on: ${this.label}`;
    }
}

/**
 * Top-level tree item for CloudFormation stacks in the Focus view.
 */
export class CloudFormationFocusTreeItem extends FocusTreeItem {
    constructor(label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Tree item representing a profile inside the CloudFormation stacks section.
 */
export class CloudFormationProfileTreeItem extends FocusTreeItem {
    constructor(
        public readonly profileName: string,
        public readonly accountId: string,
        public readonly accountName: string
    ) {
        super(`Profile: ${profileName}`, vscode.TreeItemCollapsibleState.Expanded);
        this.description = `(${accountId} - ${accountName})`;
    }
}

/** 
 * Top-level tree item for workspace IaC in the Focus view.
 */
export class WorkspaceFocusTreeItem extends FocusTreeItem {
    constructor(label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Represents a TreeItem that we weren't able to show because
 * of some error.
 */
export class FocusErrorTreeItem extends FocusTreeItem {
    constructor(public readonly errorMessage: string) {
        super(`Error: ${errorMessage}`, vscode.TreeItemCollapsibleState.None);
        this.tooltip = errorMessage;
        this.iconPath = new vscode.ThemeIcon('error');
    }
}