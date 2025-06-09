import path from "path";
import fs from "fs";

import { getInput, setFailed, setOutput } from "@actions/core";
import minimatch from "minimatch";

import { getChangedFiles } from "./getChangedFiles";
import { getRelativeWorkspaces } from "./getRelativeDirectory";
import { getRootDirectory } from "./getRootDirectory";
import { getWorkspaces } from "./getWorkspaces";
import { isValidRegex } from "./isValidRegex";

type Package = {
    name: string;
    path: string;
    relativePath: string;
    dependencies?: string[];
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

    const bizChangedPackages: Package[] = [];
    const allBizPackages: Package[] = [];
    const libChangedPackages: Package[] = [];

    const bizFilter = getInput("biz-filter");
    const libFilter = getInput("lib-filter");

    if (bizFilter && !isValidRegex(bizFilter)) {
        setFailed("bizFilter option is not valid regex.");
    }

    if (libFilter && !isValidRegex(libFilter)) {
        setFailed("libFilter option is not valid regex.");
    }

    const bizFilterRegex = bizFilter ? new RegExp(bizFilter) : null;
    const libFilterRegex = libFilter ? new RegExp(libFilter) : null;

    workspaces.forEach((workspacePath, name) => {
        const packageJsonPath = path.join(workspacePath, "package.json");
        let dependencies: string[] = [];
        if (!fs.existsSync(packageJsonPath)) {
            console.warn(`No package.json found for workspace: ${name}`);
        } else {
            const pkg = require(packageJsonPath);
            dependencies = [
                ...Object.keys(pkg.dependencies || {})
            ];
        }
        const p: Package = {
            name,
            path: workspacePath,
            relativePath: relativePathMap.get(name) || "",
            dependencies,
        };

        if (bizFilterRegex && bizFilterRegex.test(name)) {
            if (minimatch.match(changedFiles, path.join(workspacePath, "**"), { dot: true }).length > 0) {
                bizChangedPackages.push(p);
            }
            allBizPackages.push(p);
        } else if (libFilterRegex && libFilterRegex.test(name)) {
            if (minimatch.match(changedFiles, path.join(workspacePath, "**"), { dot: true }).length > 0) {
                libChangedPackages.push(p);
            }
        }
    });

    console.log(`Found ${bizChangedPackages.length} changed business packages.`);
    console.log(`Found ${libChangedPackages.length} changed library packages.`);
    console.log(`Changed biz packages: ${bizChangedPackages.map(pkg => pkg.name).join(", ")}`);
    console.log(`Changed lib packages: ${libChangedPackages.map(pkg => pkg.name).join(", ")}`);

    libChangedPackages.forEach((pkg) => {
        allBizPackages.forEach((bizPkg) => {
            if (bizPkg.dependencies && bizPkg.dependencies.includes(pkg.name)) {
                if (!bizChangedPackages.some((changedPkg) => changedPkg.name === bizPkg.name)) {
                    bizChangedPackages.push(bizPkg);
                }
            }
        });
    });

    console.log(`Final changed biz packages: ${bizChangedPackages.map(pkg => pkg.name).join(", ")}`);


    setOutput("allPackages", allBizPackages);
    setOutput("packages", bizChangedPackages);
    setOutput("empty", bizChangedPackages.length === 0);
};
