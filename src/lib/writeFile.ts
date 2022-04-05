import { writeFileSync } from "fs";
import { VersionFilePathsProps } from "../types";

export const writeVersionFiles = (files: VersionFilePathsProps, paths: VersionFilePathsProps): void => {
    writeFileSync(paths.pkgJSON, JSON.stringify(files.pkgJSON, null, 2));
};
