import * as fs from 'fs';
import path from 'path';

import * as vscode from 'vscode';
import { ResourceViewProvider } from './views/resourcesView/viewProvider';
import { FocusViewProvider } from './views/focusView/viewProvider';
import { ResourceDetailsViewProvider } from './views/resourceDetailsView/viewProvider';
import { ProviderFactory } from './services/providerFactory';
import { Focus } from './models/focusModel';

/** 
 * View provider for the resource details view - we update this based on clicks in the resources view
 */
let resourceDetailsViewProvider: ResourceDetailsViewProvider | undefined = undefined;

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

	// TODO: this is temporary, until we have a way to set the Focus dynamically.
	const jsonString: string = fs.readFileSync(path.resolve(__dirname, `../src/test/resources/mock-wildcard-regions-and-services.focus.json`), 'utf-8');
	const focus = Focus.parse(JSON.parse(jsonString));

	resourceDetailsViewProvider = new ResourceDetailsViewProvider();

	return [
		vscode.window.registerTreeDataProvider('aws-inspector.focus', new FocusViewProvider()),
		vscode.window.registerTreeDataProvider('aws-inspector.resources', new ResourceViewProvider(focus, context)),
		vscode.window.registerTreeDataProvider('aws-inspector.resource-details', resourceDetailsViewProvider),
	];
}

/**
 * Register the VS Code commands for the AWS Inspector extension.
 */
function registerCommands() {
	return [
		vscode.commands.registerCommand('aws-inspector.show-resource-details', async (profile: string, arn: string) => {
			resourceDetailsViewProvider!.setArn(profile, arn);
		})
	];
}

/**
 * This function is called when the AWS Inspector extension is deactivated
 */
export function deactivate() {}
