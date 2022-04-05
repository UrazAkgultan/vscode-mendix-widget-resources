export type PluggableWidgetPlatformType = "web" | "native" | undefined;
export type PluggableWidgetRootFolderType = "widgets" | "theme" | "themesource" | undefined;

export type VersionFilePathsProps = {
    pkgJSON: any;
    pkgXML: string;
};

export type MenuType = "category" | "folder" | "pluggableWidget";

export type AtlasFolderProps = {
    themesource: string;
    theme: string;
};
