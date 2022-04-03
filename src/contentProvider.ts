import * as vscode from "vscode";

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
