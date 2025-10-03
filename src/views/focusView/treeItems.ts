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
 * Tree item for an individual selectable filter in the Focus view. This
 * includes standard focus models, user-defined focuses, CloudFormation stacks,
 * and IaC defined directly in the workspace.
 */
export class FocusSelectableTreeItem extends FocusTreeItem {
    private selected: boolean = false;

    constructor(label: string, public getFocus: () => Promise<Focus>) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `Select to focus on: ${this.label}`;
    }
}

/**
 * Top-level tree item for resource filters in the Focus view.
 */
export class FocusFiltersTopLevelTreeItem extends FocusTreeItem {
    constructor(label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Top-level tree item for CloudFormation stacks in the Focus view.
 */
export class FocusCfnTopLevelTreeItem extends FocusTreeItem {
    constructor(label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Tree item representing a profile inside the CloudFormation stacks section.
 */
export class FocusCfnProfileTreeItem extends FocusTreeItem {
    constructor(
        public readonly profileName: string,
        public readonly accountId: string,
        public readonly accountName: string
    ) {
        super(`Profile: ${profileName}`, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = `(${accountId} - ${accountName})`;
    }
}

/**
 * Tree item representing a region inside a CloudFormation profile.
 */
export class FocusCfnRegionTreeItem extends FocusTreeItem {
    constructor(
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly locationName: string
    ) {
        super(regionName, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = locationName;
    }
}

/** 
 * Top-level tree item for workspace IaC in the Focus view.
 */
export class FocusWorkspaceTopLevelTreeItem extends FocusTreeItem {
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

/**
 * Represents a TreeItem that is essentially a placeholder. This is not an
 * error, but more for indicating that there are no resources to display.
 */
export class FocusPlaceholderTreeItem extends FocusTreeItem {
    constructor(message: string = '[ No Resources ]') {
        super(message, vscode.TreeItemCollapsibleState.None);
        this.tooltip = "No Resources to Display";
    }
}