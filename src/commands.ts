import * as vscode from "vscode";
import { PluggableWidget } from "./pluggableWidget";
import { getVersionFilePaths, readVersionFiles } from "./lib/readFile";
import { writeVersionFiles } from "./lib/writeFile";
import { join } from "path";
import Terminal from "./terminal";

export const bumpPluggableWidgetVersion = async (pluggableWidget: PluggableWidget): Promise<void> => {
    const answer = await vscode.window.showInputBox({
        title: `Bump ${pluggableWidget.name} widget version (current version is: ${pluggableWidget.version}).`,
        placeHolder: "New version number",
        value: pluggableWidget.version,
        validateInput: value =>
            value.match("^[0-9]{1,2}[.][0-9]{1,2}[.][0-9]{1,3}?$") === null ? "Invalid version number" : null
    });

    if (!answer) {
        return;
    }

    const paths = getVersionFilePaths(pluggableWidget.widgetPath!);
    const files = readVersionFiles(paths);
    files.pkgJSON.version = answer;
    writeVersionFiles(files, paths);

    await openFile(join(pluggableWidget.widgetPath!, "package.json"));
    await openFile(join(pluggableWidget.widgetPath!, "CHANGELOG.md"));
    await openFile(join(pluggableWidget.widgetPath!, "src", "package.xml"));
};

export const openFile = async (filePath: string, preview: boolean = false): Promise<void> => {
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, { preview });
};

export const createTerminal = async (pluggableWidget: PluggableWidget): Promise<void> => {
    let currentTerminal = Terminal.terminalList.find(
        terminal => terminal.getCurrentPluggableWidget().name === pluggableWidget.name
    );

    if (!currentTerminal) {
        currentTerminal = await Terminal.createTerminal(pluggableWidget);
    }
};
