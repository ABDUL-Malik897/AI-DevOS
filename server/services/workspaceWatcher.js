const chokidar = require("chokidar");
const path = require("path");

const watchers = new Map();

const normalizeRelativePath = (workspacePath, filePath) => {
    const relativePath = path.relative(workspacePath, filePath);

    return relativePath
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .trim();
};

const startWorkspaceWatcher = (projectId, workspacePath, onChange) => {
    const key = String(projectId);

    if (watchers.has(key)) {
        return watchers.get(key);
    }

    const watcher = chokidar.watch(workspacePath, {
        ignored: [
            /(^|[\/\\])node_modules([\/\\]|$)/,
            /(^|[\/\\])\.git([\/\\]|$)/,
            /(^|[\/\\])\.env$/,
        ],
        ignoreInitial: true,
        usePolling: true,
        interval: 500,
        persistent: true,
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100,
        },
    });

    const emitChange = (filePath, event) => {
        const relativePath = normalizeRelativePath(
            workspacePath,
            filePath
        );

        if (!relativePath) {
            return;
        }

        onChange({
            projectId: key,
            path: relativePath,
            event,
        });
    };

    watcher
        .on("add", (filePath) => emitChange(filePath, "add"))
        .on("change", (filePath) => emitChange(filePath, "change"))
        .on("unlink", (filePath) => emitChange(filePath, "unlink"))
        .on("error", (error) => {
            console.error(
                `Workspace watcher error for project ${key}:`,
                error
            );
        });

    watchers.set(key, watcher);

    return watcher;
};

const stopWorkspaceWatcher = async (projectId) => {
    const key = String(projectId);
    const watcher = watchers.get(key);

    if (!watcher) {
        return;
    }

    await watcher.close();
    watchers.delete(key);
};

module.exports = {
    startWorkspaceWatcher,
    stopWorkspaceWatcher,
};