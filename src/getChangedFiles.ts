import { getInput } from "@actions/core";

export const getChangedFiles = async (): Promise<string[]> => {
    const inputChangedFiles = getInput("changedFiles");
    if (!inputChangedFiles) {
        throw new Error("changedFiles is required");
    }

    const changedFiles = inputChangedFiles.split("\n").map((file) => file.trim());
    console.log("changedFiles", changedFiles);
    return changedFiles;
};
