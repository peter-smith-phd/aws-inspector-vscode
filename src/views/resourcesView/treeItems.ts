import * as vscode from 'vscode';
import { ProfileFocus, RegionFocus, ResourceTypeFocus, ServiceFocus } from '../../models/focusModel';

/**
 * The top-level class for any TreeItem in the Resources View
 */
export class ResourceTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, state?: vscode.TreeItemCollapsibleState) {
        super(label, state);
    }
}

/**
 * Represents a TreeItem for a Profile
 * @param profile The ProfileFocus object providing Profile details.
 * @param accountId The AWS account ID associated with the profile.
 * @param accountName The name of the AWS account associated with the profile.
 */
export class ResourceProfileTreeItem extends ResourceTreeItem {
    constructor(
        public readonly profile: ProfileFocus,
        public readonly accountId: string,
        public readonly accountName: string
    ) {
        super(`Profile: ${profile.id}`, vscode.TreeItemCollapsibleState.Expanded);
        this.description = `(${accountId} - ${accountName})`;
    }
}

/**
 * Represents a TreeItem for a Region
 */
export class ResourceRegionTreeItem extends ResourceTreeItem {
    constructor(
        public readonly region: RegionFocus,
        public readonly locationName: string
    ) {
        super(region.id, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = locationName;
    }
}

/**
 * Represents a TreeItem for a Service
 */
export class ResourceServiceTreeItem extends ResourceTreeItem {
    constructor(
        public readonly service: ServiceFocus,
        public readonly name: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed);
    }
}

/**
 * Represents a TreeItem for a Resource Type
 */
export class ResourceTypeTreeItem extends ResourceTreeItem {
    constructor(
        public readonly resourceType: ResourceTypeFocus,
        public readonly name: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.Expanded);
    }
}

/**
 * Represents a TreeItem for a Resource
 */
export class ResourceArnTreeItem extends ResourceTreeItem {
    constructor(
        public readonly arn: string,
        public readonly name: string,
        public readonly tooltip: string,
        public readonly iconPath: string
    ) {
        super(name);
    }
}