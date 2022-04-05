/* eslint-disable no-undef */
import * as vscode from "vscode";
import PluggableWidget from "./pluggableWidget";
import { readdirSync } from "fs";

import { pathExists } from "./helpers/fileHelper";
import { join } from "path";

export default class Terminal {
    private static _nextTerminalId: number = 1;
    static readonly terminalList: Terminal[] = [];

    readonly activeTerminal: vscode.Terminal;
    private _activeMxProjectPath: string | undefined;

    private constructor(private readonly _terminalId: number, private readonly _pluggableWidget: PluggableWidget) {
        this.activeTerminal = vscode.window.createTerminal(`Ext Terminal #${_terminalId} - (${_pluggableWidget.name})`);
    }

    updateEnvironment(key: string, value: string): void {
        this.runCommand(`export ${key}=${value}`);
    }

    changeDirectory(path: string): void {
        if (!pathExists(path)) {
            throw new Error(`The path could not be found\nPath: ${path}`);
        }

        this.runCommand(`cd ${path}`);
    }

    clear(): void {
        this.runCommand("clear");
    }

    private runCommand(command: string): void {
        this.activeTerminal.sendText(command);
        if (this.activeTerminal.exitStatus && this.activeTerminal.exitStatus.code) {
            throw new Error(
                `The command could not be run.\nExit code: ${this.activeTerminal.exitStatus.code}\nCommand: ${command}`
            );
        }
    }

    getCurrentPluggableWidget(): PluggableWidget {
        return this._pluggableWidget;
    }

    private async getMXTestProjectPath(): Promise<string | undefined> {
        let mxAppPath: string | undefined = process.env.MX_APP_PATH;

        if (!mxAppPath) {
            mxAppPath = await vscode.window.showInputBox({
                placeHolder: "Mendix test projects path",
                validateInput: value => (pathExists(value) === null ? "The path could not be found." : null)
            });

            if (!mxAppPath) {
                throw new Error("Mendix project path could not be found.");
            }
        }

        this.updateEnvironment("MX_APP_PATH", mxAppPath);

        const folders = readdirSync(mxAppPath);
        const selectedFolder = await vscode.window.showQuickPick(folders);
        return selectedFolder && join(mxAppPath, selectedFolder);
    }

    private async setUpTerminal(): Promise<void> {
        this._activeMxProjectPath = await this.getMXTestProjectPath();

        if (!this._activeMxProjectPath) {
            throw new Error("The test project could not be found.");
        }

        this.updateEnvironment("MX_PROJECT_PATH", this._activeMxProjectPath);
        this.changeDirectory(this._pluggableWidget.widgetPath);
        this.clear();
    }

    static async createTerminal(pluggableWidget: PluggableWidget): Promise<Terminal> {
        const newTerminal = new Terminal(this._nextTerminalId, pluggableWidget);
        await newTerminal.setUpTerminal();
        this.terminalList.push(newTerminal);
        this._nextTerminalId++;
        return newTerminal;
    }

    static getTerminal(terminalId: number): Terminal {
        return this.terminalList[terminalId];
    }
}
