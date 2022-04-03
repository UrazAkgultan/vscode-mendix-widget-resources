/* eslint-disable no-undef */
import { join } from "path";
import { VersionFilePathsProps } from "../types";

export const getVersionFilePaths = (rootFilePath: string): VersionFilePathsProps => ({
    pkgJSON: join(rootFilePath, "package.json"),
    pkgXML: join(rootFilePath, "src", "package.xml")
});

export const readVersionFiles = (paths: VersionFilePathsProps): VersionFilePathsProps => ({
    pkgJSON: require(paths.pkgJSON),
    pkgXML: "not-yet-supported"
});
