import { PluggableWidgetPlatformType, AtlasFolderProps } from "./types";

export default interface PluggableWidget {
    name: string;
    version: string;
    platform: PluggableWidgetPlatformType;
    widgetPath: string;
    atlasPaths?: AtlasFolderProps;
}

export class PluggableWidgetBuilder {
    private readonly _pluggableWidget: PluggableWidget;

    constructor(name: string, version: string, platform: PluggableWidgetPlatformType, widgetPath: string) {
        this._pluggableWidget = {
            name,
            version,
            platform,
            widgetPath
        };
    }

    name(name: string): PluggableWidgetBuilder {
        this._pluggableWidget.name = name;
        return this;
    }

    version(version: string): PluggableWidgetBuilder {
        this._pluggableWidget.version = version;
        return this;
    }

    platform(platform: PluggableWidgetPlatformType): PluggableWidgetBuilder {
        this._pluggableWidget.platform = platform;
        return this;
    }

    widgetPath(widgetPath: string): PluggableWidgetBuilder {
        this._pluggableWidget.widgetPath = widgetPath;
        return this;
    }

    atlasPaths(atlasPaths: AtlasFolderProps): PluggableWidgetBuilder {
        this._pluggableWidget.atlasPaths = atlasPaths;
        return this;
    }

    build(): PluggableWidget {
        return this._pluggableWidget;
    }
}
