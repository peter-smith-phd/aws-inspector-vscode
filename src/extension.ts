import * as vscode from 'vscode';
import { ResourceViewProvider } from './views/resourcesView/resourcesViewProvider';
import { FocusViewProvider } from './views/focusView/focusViewProvider';
import { ResourceDetailsViewProvider } from './views/resourceDetailsView/resourceDetailsViewProvider';
import { Account } from './awsClients/account';

/**
 * This function is called when the AWS Inspector extension is first used. It 
 * registers the views, commands, and other VS Code resources necessary for operation.
 */
export function activate(context: vscode.ExtensionContext) {
	const disposable = [
		...registerViews(),
		...registerCommands()
	];
	context.subscriptions.push(...disposable);
}

/**
 * Register the VS Code views for the AWS Inspector extension.
 */
function registerViews() {
	return [
		vscode.window.registerTreeDataProvider('aws-inspector.focus', new FocusViewProvider()),
		vscode.window.registerTreeDataProvider('aws-inspector.resources', new ResourceViewProvider()),
		vscode.window.registerTreeDataProvider('aws-inspector.resource-details', new ResourceDetailsViewProvider()),
	];
}

/**
 * Register the VS Code commands for the AWS Inspector extension.
 */
function registerCommands() {
	return [
		// TODO: remove this, it's just for testing.
		vscode.commands.registerCommand('aws-inspector.helloWorld', async () => {
			const output = await Account.listRegions('aws');
			vscode.window.showInformationMessage('Hello World from AWS Inspector!' + JSON.stringify(output));
		})
	];
}

/**
 * This function is called when the AWS Inspector extension is deactivated
 */
export function deactivate() {}
