import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ResourceArnTreeItem, ResourceProfileTreeItem, ResourceRegionTreeItem, ResourceServiceTreeItem, ResourceTreeItem, ResourceTypeTreeItem } from './treeItems';
import { Focus, ProfileFocus, RegionFocus, ResourceTypeFocus, ServiceFocus } from '../../models/focusModel';

/**
 * Provider for a view that shows all the profile/region/service/resource information
 * that is in focus
 */
export class ResourceViewProvider implements vscode.TreeDataProvider<ResourceTreeItem> {

    private focus: Focus;

    constructor(private readonly context: vscode.ExtensionContext) {
        // TODO: create a way to dynamically set which focus is being used.
        const jsonString: string = fs.readFileSync(path.resolve(__dirname, `../src/test/resources/mock-cdk-deployment-1.focus.json`), 'utf-8');
        this.focus = Focus.parse(JSON.parse(jsonString));
    }

    onDidChangeTreeData?: vscode.Event<any> | undefined;

    getTreeItem(element: ResourceTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<ResourceTreeItem[]> {
        if (!element) {
            return this.makeResourceProfiles(this.focus);
        } else if (element instanceof ResourceProfileTreeItem) {
            return this.makeResourceRegions(element.profile);
        } else if (element instanceof ResourceRegionTreeItem) {
            return this.makeResourceServices(element.region);
        } else if (element instanceof ResourceServiceTreeItem) {
            return this.makeResourceTypes(element.service);
        } else if (element instanceof ResourceTypeTreeItem) {
            return this.makeResourceArns(element.resourceType);
        }
        return Promise.resolve([]);
    }

    getParent?(element: ResourceTreeItem) {
        return null;
    }
    
    resolveTreeItem?(item: vscode.TreeItem, element: ResourceTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

    /**
     * Create ResourceProfileTreeItems from the profiles in the focus. The profiles must have
     * valid names, and can not be a wildcard. We need to fetch the profile account's number and name.
     */
    private makeResourceProfiles(focus: Focus): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.all(focus.profiles.map(async profile => {
            return new ResourceProfileTreeItem(profile, '123412341234', 'staging');
        }));
    }

    /**
     * Create ResourceRegionTreeItems from the regions in the profile.
     */
    private makeResourceRegions(profile: ProfileFocus): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.all(profile.regions.map(async region => {
            return new ResourceRegionTreeItem(region, 'Location Name');
        }));
    }

    /**
     * Create ResourceServiceTreeItems from the services in the region.
     */
    private makeResourceServices(region: RegionFocus): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.all(region.services.map(async service => {
            // TODO: use the human-readable name for this service.
            const name = service.id;
            return new ResourceServiceTreeItem(service, name);
        }));
    }

    /**
     * Create ResourceTypeTreeItems from the resource types in the service.
     */
    private makeResourceTypes(service: ServiceFocus): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.all(service.resourcetypes.map(async resourceType => {
            // TODO: use the human-readable name for this resource type.
            const name = resourceType.id;
            return new ResourceTypeTreeItem(resourceType, name);
        }));
    }

    /**
     * Create ResourceArnTreeItems from the ARNs in the resource type.
     */
    private makeResourceArns(resourceType: ResourceTypeFocus): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.all(resourceType.arns.map(async arn => {
            // TODO: extract the short name for this resource.
            const name = arn;
            // TODO: compute the correct icon for this resource
            const iconPath = path.join(this.context.extensionPath, 'resources', 'icons', 'services', 'stepfunctions.svg');
            // TODO: add a tooltip for this resource
            const tooltip = 'Step Functions State Machine';
            return new ResourceArnTreeItem(arn, name, tooltip, iconPath);
        }));
    }
}