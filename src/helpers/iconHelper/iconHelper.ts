import { folderIcons } from "./folderIcons";
import { fileIcons } from "./fileIcons";

export const getFolderIcon = (folder: string): string => {
    const folderIcon = folderIcons.find(folderIcon => folderIcon.folderNames.find(name => name === folder));

    return `${folderIcon?.name ?? "folder-default"}.svg`;
};

export const getFileIcon = (file: string): string => {
    let fileIconPath: string | undefined = "";

    fileIconPath = fileIcons.find(fileIcon => fileIcon.fileNames?.find(filename => filename === file))?.name;

    if (!fileIconPath) {
        const currentFileExtension = getFileExtension(file);
        fileIconPath = fileIcons.find(fileIcon =>
            fileIcon.fileExtensions?.find(fileExtension => fileExtension === currentFileExtension)
        )?.name;
    }

    return `${fileIconPath ?? "file"}.svg`;
};

const getFileExtension = (filename: string): string | undefined => filename.split(".").pop();
