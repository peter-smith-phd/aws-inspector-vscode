import path from "path";
import * as vscode from 'vscode';

/**
 * Given the name of the AWS service, return the appropriate icon path.
 */
export function getIconForService(context: vscode.ExtensionContext, service: string): string {
    return path.join(context.extensionPath, 'resources', 'icons', 'services', `${service}.svg`);
}
