/* eslint-disable no-undef */
import * as vscode from "vscode";
import { openFile, createTerminal, bumpPluggableWidgetVersion } from "./commands";
import { PluggableWidgetsProvider, PluggableWidgetItem } from "./providers";

export function activate(_: vscode.ExtensionContext): void {
    const rootPath =
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined;

    if (!rootPath) {
        vscode.window.showErrorMessage("Empty workspace");
        return;
    }

    vscode.commands.registerCommand("extensions.openFile", async (folderPath, isFile = false) => {
        if (isFile) {
            openFile(folderPath, true);
        }
    });

    vscode.commands.registerCommand(
        "widget-resources-explorer.createTerminal",
        (pluggableWidgetItem: PluggableWidgetItem) => createTerminal(pluggableWidgetItem.pluggableWidget)
    );

    vscode.commands.registerCommand(
        "widget-resources-explorer.bumpPluggableWidgetVersion",
        async (pluggableWidgetItem: PluggableWidgetItem) => {
            await bumpPluggableWidgetVersion(pluggableWidgetItem.pluggableWidget);
            pluggableWidgetProvider.refresh();
        }
    );

    const pluggableWidgetProvider = new PluggableWidgetsProvider(rootPath);
    vscode.window.registerTreeDataProvider("pluggableWidgets", pluggableWidgetProvider);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
    console.log("");
}
