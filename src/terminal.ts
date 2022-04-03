/* eslint-disable no-undef */
import * as vscode from "vscode";
import { PluggableWidget } from "./pluggableWidget";
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
        this.activeTerminal.sendText(`cd ${_pluggableWidget.widgetPath}`);
    }

    private async setUpTerminal(): Promise<void> {
        this._activeMxProjectPath = await this.getMXTestProjectPath();

        if (!this._activeMxProjectPath) {
            throw new Error("No MX test project.");
        }

        this.updateEnvironment("MX_PROJECT_PATH", this._activeMxProjectPath);
        this.updateEnvironment("MX_NMR_PATH", this._activeMxProjectPath);

        this.activeTerminal.sendText("clear");
    }

    private async getMXTestProjectPath(): Promise<string | undefined> {
        const mxAppPath: string | undefined = process.env.MX_APP_PATH;
        let mxNMRPath: string | undefined = process.env.MX_NMR_PATH;

        if (mxNMRPath) {
            if (!pathExists(mxNMRPath)) {
                mxNMRPath = "";
            }
        }

        let mxTestProjectPathAnswer: string | undefined;

        if (mxAppPath) {
            const folders = readdirSync(mxAppPath!);

            const selectedFolder = await vscode.window.showQuickPick(folders);
            mxTestProjectPathAnswer = selectedFolder && join(mxAppPath, selectedFolder);
        } else {
            mxTestProjectPathAnswer = await vscode.window.showInputBox({
                placeHolder: "Mendix test project path",
                value: mxNMRPath,
                validateInput: value => (pathExists(value) === null ? "Path couldn't find." : null)
            });
        }

        if (!mxTestProjectPathAnswer) {
            return undefined;
        }

        return mxTestProjectPathAnswer;
    }

    updateEnvironment(key: string, value: string): string {
        this.activeTerminal.sendText(`export ${key}=${value}`);
        return value;
    }

    getCurrentPluggableWidget(): PluggableWidget {
        return this._pluggableWidget;
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
