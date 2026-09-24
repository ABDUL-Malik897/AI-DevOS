const fs = require("fs/promises");
const path = require("path");

const File = require("../models/File");

const ignoredDirectories = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".cache",
    "coverage",
    "out",
    "vendor"
]);

const ignoredFiles = new Set([
    ".DS_Store",
    "Thumbs.db"
]);

const scanDirectory = async (directory, rootDirectory, projectId, files) => {
    const entries = await fs.readdir(directory,
        {
            withFileTypes: true
        }
    );

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        const relativePath = path.relative(rootDirectory, fullPath).replace(/\\/g, "/");
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
            continue;
        }
        if (entry.isFile() && ignoredFiles.has(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            files.push({
                project: projectId,
                path: relativePath,
                name: entry.name,
                extension: "",
                size: 0,
                type: "directory"
            });
            await scanDirectory(fullPath, rootDirectory,projectId, files);
        }

        if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            files.push({
                project: projectId,
                path: relativePath,
                name: entry.name,
                extension: path.extname(entry.name),
                size: stats.size,
                type: "file"
            });
        }
    }
};

const scanProjectFiles = async (workspacePath,projectId) => {
    const files = [];
    await scanDirectory(workspacePath, workspacePath,projectId,files);
    await File.deleteMany({
        project: projectId
    });
    if (files.length > 0) {
        await File.insertMany(files);
    }
    return files;
};

module.exports = {
    scanProjectFiles
};