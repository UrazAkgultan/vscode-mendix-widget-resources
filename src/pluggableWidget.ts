/* eslint-disable no-undef */
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { pathExists } from "./helpers/fileHelper";

import { PluggableWidgetPlatformType } from "./types";

import { ContentProvider, ContentItem } from "./contentProvider";

export class PluggableWidgetsProvider extends ContentProvider {
    readonly pluggableWidgetPath: string;

    constructor(workspaceRoot: string) {
        super();
        this.pluggableWidgetPath = path.join(workspaceRoot, "packages/pluggableWidgets");
    }

    getChildren(
        element?: ContentItem | PluggableWidget | PluggableWidgetPlatformItem
    ): vscode.ProviderResult<ContentItem[]> {
        if (element) {
            return this._getPluggableWidgetsInWorkspace().filter(
                widget => widget.platform === (element as PluggableWidgetPlatformItem).widgetPlatform
            );
        }

        return Promise.resolve([new PluggableWidgetPlatformItem("web"), new PluggableWidgetPlatformItem("native")]);
    }

    private _getPluggableWidgetsInWorkspace(): PluggableWidget[] {
        const folders = fs.readdirSync(this.pluggableWidgetPath);

        return folders
            .map(folder => {
                const widgetPath: string = path.join(this.pluggableWidgetPath, folder);
                const widgetPackageJSONPath: string = path.join(widgetPath, "package.json");

                if (!pathExists(widgetPackageJSONPath)) {
                    return new PluggableWidget("", "", undefined);
                }

                const widgetPackageJSONContent = JSON.parse(fs.readFileSync(widgetPackageJSONPath, "utf-8"));
                const widgetPackageNameSplit = widgetPackageJSONContent.name.split("-");
                const widgetPlatform = widgetPackageNameSplit.slice(-1)[0];

                return new PluggableWidget(
                    widgetPackageJSONContent.widgetName,
                    widgetPackageJSONContent.version,
                    widgetPlatform,
                    widgetPath,
                    {
                        command: "extensions.openFile",
                        title: "",
                        arguments: [widgetPackageJSONPath]
                    }
                );
            })
            .filter(widget => widget.name !== "");
    }
}

export class PluggableWidgetPlatformItem extends ContentItem {
    constructor(public readonly widgetPlatform: PluggableWidgetPlatformType) {
        super(widgetPlatform!, "pluggableWidgetPlatformCategory", vscode.TreeItemCollapsibleState.Collapsed);
    }
}

export class PluggableWidget extends ContentItem {
    constructor(
        public readonly name: string,
        public readonly version: string,
        public readonly platform: PluggableWidgetPlatformType,
        public readonly widgetPath?: string,
        public readonly command?: vscode.Command
    ) {
        super(name, "pluggableWidget", vscode.TreeItemCollapsibleState.Collapsed);
        this.description = `v${version}`;
    }
}
