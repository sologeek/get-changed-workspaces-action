import { getInput } from "@actions/core";

export const getChangedFiles = async (): Promise<string[]> => {
    const inputChangedFiles = getInput("changed-files");
    if (!inputChangedFiles) {
        throw new Error("changed-files is required");
    }

    const changedFiles = inputChangedFiles.split(/\s/).map((file) => file.trim());
    console.log("changed-files", changedFiles);
    return changedFiles;
};
