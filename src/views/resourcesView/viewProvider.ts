import * as vscode from 'vscode';

import { ResourceArnTreeItem, ResourceErrorTreeItem, ResourceProfileTreeItem, ResourceRegionTreeItem, ResourceServiceTreeItem, ResourceTreeItem, ResourceTypeTreeItem } from './treeItems';
import { Focus } from '../../models/focusModel';
import { ProviderFactory } from '../../services/providerFactory';
import ARN from '../../models/arnModel';
import { getRegionLongName } from '../../models/regionModel';
import { STS } from '../../awsClients/sts';
import { IAM } from '../../awsClients/iam';
import { Account } from '../../awsClients/account';

/**
 * Provider for a view that shows all the profile/region/service/resource information
 * that is in focus
 */
export class ResourceViewProvider implements vscode.TreeDataProvider<ResourceTreeItem> {

    constructor(
        public readonly focus: Focus,
        private readonly context: vscode.ExtensionContext
    ) { /* empty */ }

    onDidChangeTreeData?: vscode.Event<any> | undefined;

    getTreeItem(element: ResourceTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<ResourceTreeItem[]> {
        if (!element) {
            return this.makeResourceProfiles(this.focus);
        } else if (element instanceof ResourceProfileTreeItem) {
            return this.makeResourceRegions(element);
        } else if (element instanceof ResourceRegionTreeItem) {
            return this.makeResourceServices(element);
        } else if (element instanceof ResourceServiceTreeItem) {
            return this.makeResourceTypes(element);
        } else if (element instanceof ResourceTypeTreeItem) {
            return this.makeResourceArns(element);
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
            return Promise.all([
                STS.getCallerIdentity(profile.id),
                IAM.getAccountAlias(profile.id)
            ]).then(([{ account }, alias]) => {
                return new ResourceProfileTreeItem(profile, account, alias);
            }).catch((error) => {
                /* error communicating with AWS, possibly bad credentials */
                return new ResourceErrorTreeItem(`Invalid Profile: ${profile.id}. ${error}`);
            });
        }));
    }

    /**
     * Create ResourceRegionTreeItems from the regions in the profile.
     */
    private makeResourceRegions(parent: ResourceProfileTreeItem): vscode.ProviderResult<ResourceTreeItem[]> {
        /* 
         * If there's a single region listed, and the region name is "*", then dynamically list all of
         * the actual regions available in the current profile.
         */
        const regions = parent.profile.regions;
        if (regions.length === 1 && regions[0].id === "*") {
            const services = regions[0].services;
            return Account.listRegions(parent.profile.id).then(regions => {
                return regions.map(region => {
                    const longName = getRegionLongName(region);
                    const regionFocus = { id: region, services: services };
                    return new ResourceRegionTreeItem(parent, regionFocus, longName);
                });
            });
        }

        /* else, show only the specified regions */
        return Promise.all(regions.map(async region => {
            const longName = getRegionLongName(region.id);
            return new ResourceRegionTreeItem(parent, region, longName);
        }));
    }

    /**
     * Create ResourceServiceTreeItems from the services in the region.
     */
    private makeResourceServices(parent: ResourceRegionTreeItem): vscode.ProviderResult<ResourceTreeItem[]> {
        return Promise.all(parent.region.services.map(async service => {
            const provider = ProviderFactory.getProviderForService(service.id);
            return new ResourceServiceTreeItem(parent, service, provider, provider.getName());
        }));
    }

    /**
     * Create ResourceTypeTreeItems from the resource types in the service.
     */
    private makeResourceTypes(parent: ResourceServiceTreeItem): vscode.ProviderResult<ResourceTreeItem[]> {
        const serviceProvider = parent.provider;
        return Promise.all(parent.service.resourcetypes.map(async resourcetype => {
            const [_, pluralName] = serviceProvider.getResourceTypeNames(resourcetype.id);
            return new ResourceTypeTreeItem(parent, resourcetype, pluralName);
        }));
    }

    /**
     * Create ResourceArnTreeItems from the ARNs in the resource type.
     */
    private makeResourceArns(parent: ResourceTypeTreeItem): vscode.ProviderResult<ResourceTreeItem[]> {
        const serviceProvider = parent.parent.provider;
        const serviceName = serviceProvider.getName();
        const serviceIconPath = serviceProvider.getIconPath(serviceProvider.getId());
        const [singularName, _] = serviceProvider.getResourceTypeNames(parent.resourceType.id);

        return Promise.all(parent.resourceType.arns.map(async arn => {
            const name = new ARN(arn).resourceName || 'Unknown Resource Name';

            /* Tooltip has form: <Service Name> <Resource Type Name> */
            const tooltip = `${serviceName} ${singularName}`;

            return new ResourceArnTreeItem(parent, arn, name, tooltip, serviceIconPath);
        }));
    }
}