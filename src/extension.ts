import * as vscode from 'vscode';
import { ResourceViewProvider } from './views/resourcesView/viewProvider';
import { FocusViewProvider } from './views/focusView/viewProvider';
import { ResourceDetailsViewProvider } from './views/resourceDetailsView/viewProvider';
import { ProviderFactory } from './services/providerFactory';
import { ResourceArnTreeItem } from './views/resourcesView/treeItems';

/**
 * This function is called when the AWS Inspector extension is first used. It 
 * registers the views, commands, and other VS Code resources necessary for operation.
 */
export function activate(context: vscode.ExtensionContext) {
	/* the providers give access to information about AWS Services */
	ProviderFactory.initialize(context);

	/* Add all views and commands etc */
	context.subscriptions.push(...registerViews(context));
	context.subscriptions.push(...registerCommands());
}

/**
 * Register the VS Code views for the AWS Inspector extension.
 */
function registerViews(context: vscode.ExtensionContext) {

	// TODO: change to canSelectMany: true when multiple focus selection is supported
	const focusViewProvider = new FocusViewProvider(context);
	const focusView = vscode.window.createTreeView(
		'aws-inspector.focus', { treeDataProvider: focusViewProvider, canSelectMany: false });

	const resourcesViewProvider = new ResourceViewProvider(context);
	const resourcesView = vscode.window.createTreeView(
		'aws-inspector.resources', { treeDataProvider: resourcesViewProvider });

	const resourceDetailsViewProvider = new ResourceDetailsViewProvider();
	const resourceDetailsView = vscode.window.createTreeView(
		'aws-inspector.resource-details', { treeDataProvider: resourceDetailsViewProvider });

	/* 
	 * Clicking in the Focus view will update the Resources view with the new focus
	 */
	focusView.onDidChangeSelection(async e => {
		const focus = await focusViewProvider.getFocusFromSelection(e.selection);
		if (focus) {
			resourcesViewProvider.setFocus(focus);
		}
	});

	/* 
	 * Clicking in the Resources view will update the Resource Details view
	 */
	resourcesView.onDidChangeSelection(e => {
		if (e.selection.length === 1 && e.selection[0] instanceof ResourceArnTreeItem) {
			const treeItem: ResourceArnTreeItem = e.selection[0];
			const profile = treeItem.parent.parent.parent.parent.profile.id;
			resourceDetailsViewProvider.setArn(profile, treeItem.arn);
		}
	});

	return [ focusView, resourcesView, resourceDetailsView ];
}

/**
 * Register the VS Code commands for the AWS Inspector extension.
 */
function registerCommands() {
	return [];
}

/**
 * This function is called when the AWS Inspector extension is deactivated
 */
export function deactivate() {}
