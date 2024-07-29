import path from "path";

import { getInput, setFailed, setOutput } from "@actions/core";
import minimatch from "minimatch";

import { getChangedFiles } from "./getChangedFiles";
import { getRootDirectory } from "./getRootDirectory";
import { getWorkspaces } from "./getWorkspaces";
import { isValidRegex } from "./isValidRegex";
import { getRelativeWorkspaces } from "./getRelativeDirectory";

type Package = {
    name: string;
    path: string;
    relativePath: string;
};

export const run = async () => {
    console.log("Running get-changed-workspaces-action");
    const gitRoot = await getRootDirectory();
    const changedFiles = (await getChangedFiles()).map((file) => path.join(gitRoot, file));
    const workspaces = await getWorkspaces();
    const relativeWorkspaces = await getRelativeWorkspaces();
    const relativePathMap = new Map<string, string>();

    relativeWorkspaces.forEach((workspacePath, name) => {
        relativePathMap.set(name, workspacePath);
    });

    const packages: Package[] = [];
    const allPackages: Package[] = [];

    const filter = getInput("filter");

    if (!isValidRegex(filter)) {
        setFailed("Filter option is not valid regex.");
    }

    const filterRegex = new RegExp(filter);

    workspaces.forEach((workspacePath, name) => {
        if (filterRegex.test(name)) {
            allPackages.push({ name, path: workspacePath, relativePath: relativePathMap.get(name) || "" });
            if (minimatch.match(changedFiles, path.join(workspacePath, "**"), { dot: true, }).length > 0) {
                packages.push({ name, path: workspacePath, relativePath: relativePathMap.get(name) || "" });
            }
        }
    });

    setOutput("allPackages", allPackages);
    setOutput("packages", packages);
    setOutput("empty", packages.length === 0);
};
