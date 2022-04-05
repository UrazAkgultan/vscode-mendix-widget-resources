import { accessSync } from "fs";

export const pathExists = (p: string): string | null => {
    try {
        accessSync(p);
    } catch (err) {
        return null;
    }

    return p;
};

export const newFileFromTemplate = (template: string): void => {};
