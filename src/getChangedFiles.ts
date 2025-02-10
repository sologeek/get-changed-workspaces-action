import { getInput } from "@actions/core";

export const getChangedFiles = async (): Promise<string[]> => {
    const inputChangedFiles = getInput("changed-files");
    if (!inputChangedFiles) {
        throw new Error("changed-files is required");
    }

    console.log("inputChangedFiles", inputChangedFiles);

    console.log("inputChangedFiles Length", inputChangedFiles.length);

    console.log("inputChangedFiles Split", inputChangedFiles.split("\n"));

    const changedFiles = inputChangedFiles.split("\n").map((file) => file.trim());
    console.log("changedFiles", changedFiles);
    return changedFiles;
};
