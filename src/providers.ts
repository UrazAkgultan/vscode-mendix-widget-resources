/* eslint-disable no-undef */
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { PluggableWidgetPlatformType, PluggableWidgetRootFolderType } from "./types";

import { getFolderIcon, getFileIcon } from "./helpers/iconHelper/iconHelper";
import { pathExists } from "./helpers/fileHelper";

import PluggableWidget, { PluggableWidgetBuilder } from "./pluggableWidget";

export abstract class ContentProvider implements vscode.TreeDataProvider<ContentItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContentItem | undefined | void> = new vscode.EventEmitter<
        ContentItem | undefined | void
    >();

    onDidChangeTreeData?: vscode.Event<void | ContentItem | ContentItem[] | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ContentItem): vscode.TreeItem {
        return element;
    }

    abstract getChildren(element?: ContentItem): vscode.ProviderResult<ContentItem[]>;
}

export class ContentItem extends vscode.TreeItem {
    constructor(
        public override label: string,
        public override contextValue: string,
        public override collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public override tooltip?: string,
        public override description?: string
    ) {
        super(label, collapsibleState);
    }
}

export class PluggableWidgetsProvider extends ContentProvider {
    readonly pluggableWidgetPath: string;
    readonly widgetThemeSourcePath: string;
    readonly widgetThemePath: string;
    readonly atlasPath: string;

    constructor(workspaceRoot: string) {
        super();
        this.pluggableWidgetPath = path.join(workspaceRoot, "packages/pluggableWidgets");
        this.atlasPath = path.join(workspaceRoot, "packages", "theming", "atlas");
        this.widgetThemeSourcePath = path.join(
            this.atlasPath,
            "src",
            "themesource",
            "atlas_core",
            "{platform}",
            "core"
        );
        this.widgetThemePath = path.join(this.atlasPath, "src", "theme", "{platform}");
    }

    getChildren(element?: ContentItem): vscode.ProviderResult<ContentItem[]> {
        if (!element) {
            return Promise.resolve([new PluggableWidgetPlatformItem("web"), new PluggableWidgetPlatformItem("native")]);
        }

        const constructorName = element.constructor.name;

        if (constructorName === "PluggableWidgetPlatformItem") {
            const pluggableWidgetPlatformItemElement = element as PluggableWidgetPlatformItem;
            return Promise.resolve([
                new PluggableWidgetsRootItem("theme", pluggableWidgetPlatformItemElement.widgetPlatform),
                new PluggableWidgetsRootItem("themesource", pluggableWidgetPlatformItemElement.widgetPlatform),
                new PluggableWidgetsRootItem("widgets", pluggableWidgetPlatformItemElement.widgetPlatform)
            ]);
        } else if (constructorName === "PluggableWidgetsRootItem") {
            const pluggableWidgetFolderItemElement = element as PluggableWidgetsRootItem;
            const widgetThemeSourcePath: string = this.widgetThemeSourcePath.replace(
                /{platform}/i,
                pluggableWidgetFolderItemElement.platform!
            );
            const widgetThemePath: string = this.widgetThemePath.replace(
                /{platform}/i,
                pluggableWidgetFolderItemElement.platform!
            );
            if (pluggableWidgetFolderItemElement.folderType === "widgets") {
                return Promise.resolve(
                    this._getPluggableWidgetsInWorkspace().filter(
                        pluggableWidgetItem =>
                            pluggableWidgetItem.pluggableWidget.platform === pluggableWidgetFolderItemElement.platform
                    )
                );
            } else if (pluggableWidgetFolderItemElement.folderType === "theme") {
                return Promise.resolve(this._getFolderList(widgetThemePath));
            } else if (pluggableWidgetFolderItemElement.folderType === "themesource") {
                return Promise.resolve(this._getFolderList(widgetThemeSourcePath));
            }
        } else if (constructorName === "PluggableWidgetItem") {
            const pluggableWidgetElement = element as PluggableWidgetItem;
            return Promise.resolve(this._getFolderList(pluggableWidgetElement.pluggableWidget.widgetPath));
        } else if (constructorName === "FileItem") {
            const fileItemElement = element as FileItem;
            return Promise.resolve(this._getFolderList(fileItemElement.filePath));
        }
    }

    private _getFolderList(filePath: string): FileItem[] {
        const folders = fs.readdirSync(filePath);

        return folders
            .map<FileItem>(folderName => {
                const folderPath = path.join(filePath, folderName);
                const stats = fs.statSync(folderPath);
                return new FileItem(
                    folderName,
                    folderPath,
                    stats.isFile(),
                    stats.isDirectory()
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None,
                    {
                        command: "extensions.openFile",
                        title: "",
                        arguments: [folderPath, stats.isFile()]
                    }
                );
            })
            .sort((a, b) => +a.isFile - +b.isFile || a.name.localeCompare(b.name));
    }

    private _getPluggableWidgetsInWorkspace(): PluggableWidgetItem[] {
        const folders = fs.readdirSync(this.pluggableWidgetPath);
        return folders
            .map(folder => {
                const pluggableWidgetBuilder: PluggableWidgetBuilder = new PluggableWidgetBuilder(
                    "",
                    "",
                    undefined,
                    ""
                );
                const widgetPath: string = path.join(this.pluggableWidgetPath, folder);
                const widgetPackageJSONPath: string = path.join(widgetPath, "package.json");

                if (!pathExists(widgetPackageJSONPath)) {
                    return new PluggableWidgetItem(pluggableWidgetBuilder.build(), undefined);
                }

                const widgetPackageJSONContent = JSON.parse(fs.readFileSync(widgetPackageJSONPath, "utf-8"));
                const widgetPackageNameSplit = widgetPackageJSONContent.name.split("-");
                const widgetPlatform = widgetPackageNameSplit.slice(-1)[0];
                const widgetThemeSourcePath: string = this.widgetThemeSourcePath.replace(/{platform}/i, widgetPlatform);
                const widgetThemePath: string = this.widgetThemePath.replace(/{platform}/i, widgetPlatform);
                return new PluggableWidgetItem(
                    pluggableWidgetBuilder
                        .name(widgetPackageJSONContent.widgetName)
                        .version(widgetPackageJSONContent.version)
                        .platform(widgetPlatform)
                        .widgetPath(widgetPath)
                        .atlasPaths({
                            themesource: widgetThemeSourcePath,
                            theme: widgetThemePath
                        })
                        .build()
                );
            })
            .filter(pluggableWidgetItem => pluggableWidgetItem.pluggableWidget.name !== "");
    }
}

export class PluggableWidgetItem extends ContentItem {
    constructor(public readonly pluggableWidget: PluggableWidget, public readonly command?: vscode.Command) {
        super(pluggableWidget.name, "pluggableWidget", vscode.TreeItemCollapsibleState.Collapsed);
        const icon = path.join(__filename, "..", "..", "resources", "icons", getFolderIcon("mx"));
        this.description = `v${pluggableWidget.version}`;
        this.iconPath = {
            light: icon,
            dark: icon
        };
    }
}

export class FileItem extends ContentItem {
    constructor(
        public readonly name: string,
        public readonly filePath: string,
        public readonly isFile: boolean = false,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
        public readonly command?: vscode.Command
    ) {
        super(name, "folder", collapsibleState);
        const icon = path.join(
            __filename,
            "..",
            "..",
            "resources",
            "icons",
            isFile ? getFileIcon(name) : getFolderIcon(name)
        );
        this.iconPath = {
            light: icon,
            dark: icon
        };
    }
}

export class PluggableWidgetPlatformItem extends ContentItem {
    constructor(public readonly widgetPlatform: PluggableWidgetPlatformType) {
        super(widgetPlatform!, "pluggableWidgetPlatformCategory", vscode.TreeItemCollapsibleState.Collapsed);
        const icon = path.join(__filename, "..", "..", "resources", "icons", getFolderIcon(widgetPlatform!));
        this.iconPath = {
            light: icon,
            dark: icon
        };
    }
}

export class PluggableWidgetsRootItem extends ContentItem {
    constructor(
        public readonly folderType: PluggableWidgetRootFolderType,
        public readonly platform: PluggableWidgetPlatformType
    ) {
        super(folderType!, "pluggableWidgetFolder", vscode.TreeItemCollapsibleState.Collapsed);
        const icon = path.join(__filename, "..", "..", "resources", "icons", getFolderIcon(folderType!));
        this.iconPath = {
            light: icon,
            dark: icon
        };
    }
}
