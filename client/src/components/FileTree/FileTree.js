import { useEffect, useRef, useState } from "react";
import { FileIcon } from "@react-symbols/icons/utils";
import "./FileTree.css";

const FileTree = ({
    files,
    onFileSelect,
    onCreateFile,
    onRenameFile,
    onCreateFolder,
    onRefresh,
    onDeleteFile,
    onRenameFolder,
    onDeleteFolder,
    creatingFile,
    creatingFolder,
    refreshing
}) => {

    const [expanded, setExpanded] = useState({});
    const [openMenuPath, setOpenMenuPath] = useState(null);
    const menuRef = useRef(null);

    const toggleFolder = (path) => {
        setExpanded((previous) => ({
            ...previous,
            [path]: !previous[path]
        }));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setOpenMenuPath(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const buildTree = () => {
        const root = {};
        files.forEach((file) => {
            const parts = file.path.split("/");
            let current = root;
            parts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = {
                        __file: index === parts.length - 1 ? file : null,
                        __children: {}
                    };
                }
                current = current[part].__children;
            });
        });
        return root;
    };

    const tree = buildTree();

    const handleCreateFile = async () => {
        const filePath = window.prompt("Enter the file path:\nExample: src/components/Button.jsx");
        if (!filePath?.trim()) {
            return;
        }
        await onCreateFile(filePath.trim());
    };

    const handleCreateFolder = async () => {
        const folderPath = window.prompt("Enter the folder path:\nExample: src/components/new-folder");
        if (!folderPath?.trim()) {
            return;
        }
        await onCreateFolder(folderPath.trim());
    };

    const handleRenameFile = async (file) => {
        const newName = window.prompt(
            "Enter the new file name:",
            file.path.split("/").pop()
        );

        if (!newName?.trim()) {
            return;
        }

        await onRenameFile(file, newName.trim());

        setOpenMenuPath(null);
    };

    const handleCreateFileInFolder = async (folderPath) => {
        const fileName = window.prompt(
            `Enter the new file name inside "${folderPath}":\nExample: index.js`
        );

        if (!fileName?.trim()) {
            return;
        }

        const cleanName = fileName.trim();

        if (
            cleanName.includes("/") ||
            cleanName.includes("\\")
        ) {
            window.alert("Please enter only a file name.");
            return;
        }

        await onCreateFile(
            `${folderPath}/${cleanName}`
        );

        setOpenMenuPath(null);
    };

    const handleCreateFolderInFolder = async (parentPath) => {
        const folderName = window.prompt(
            `Enter the new folder name inside "${parentPath}":\nExample: components`
        );

        if (!folderName?.trim()) {
            return;
        }

        const cleanName = folderName.trim();

        if (
            cleanName.includes("/") ||
            cleanName.includes("\\")
        ) {
            window.alert("Please enter only a folder name.");
            return;
        }

        await onCreateFolder(
            `${parentPath}/${cleanName}`
        );

        setOpenMenuPath(null);
    };

    const handleRenameFolder = async (folderPath, folderRecord) => {
        const currentName = folderPath.split("/").pop();

        const newName = window.prompt(
            "Enter the new folder name:",
            currentName
        );

        if (!newName?.trim()) {
            return;
        }

        const cleanName = newName.trim();

        if (
            cleanName.includes("/") ||
            cleanName.includes("\\")
        ) {
            window.alert("Please enter only a folder name.");
            return;
        }

        if (!folderRecord) {
            window.alert(
                "This folder does not have a database record yet."
            );
            return;
        }

        await onRenameFolder(
            folderRecord,
            cleanName
        );

        setOpenMenuPath(null);
    };

    const renderTree = (node, parentPath = "") => {
        return Object.entries(node).map(([name, value]) => {
            const fullPath = parentPath ? `${parentPath}/${name}` : name;
            const isFolder = value.__file?.type === "directory" || Object.keys(value.__children).length > 0;
            const isExpanded = expanded[fullPath];

            if (isFolder) {
                return (
                    <div
                        key={fullPath}
                        className="file-tree-folder"
                    >
                        <div
                            className="file-tree-row"
                            ref={openMenuPath === fullPath ? menuRef : null}
                        >
                            <button
                                type="button"
                                className="file-tree-folder-button"
                                onClick={() => toggleFolder(fullPath)}
                            >
                                <span className="file-tree-arrow">
                                    {isExpanded ? "▼" : "▶"}
                                </span>

                                <span className="file-tree-folder-icon">
                                    {isExpanded ? "📂" : "📁"}
                                </span>

                                <span className="file-tree-name">
                                    {name}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="file-tree-more-button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuPath(
                                        openMenuPath === fullPath
                                            ? null
                                            : fullPath
                                    );
                                }}
                                title="More actions"
                            >
                                ⋮
                            </button>

                            {openMenuPath === fullPath && (
                                <div className="file-tree-action-menu">
                                    <button
                                        type="button"
                                        onClick={() => handleCreateFileInFolder(fullPath)}
                                    >
                                        New File
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCreateFolderInFolder(fullPath)
                                        }
                                    >
                                        New Folder
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRenameFolder(
                                                fullPath,
                                                value.__file
                                            )
                                        }
                                    >
                                        Rename
                                    </button>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!value.__file) {
                                                window.alert(
                                                    "This folder does not have a database record yet."
                                                );
                                                return;
                                            }

                                            await onDeleteFolder(value.__file);
                                            setOpenMenuPath(null);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="file-tree-children">
                                {renderTree(value.__children, fullPath)}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div
                    key={fullPath}
                    className="file-tree-row"
                    ref={openMenuPath === fullPath ? menuRef : null}
                >
                    <button
                        type="button"
                        className="file-tree-file-button"
                        onClick={() => onFileSelect(value.__file)}
                    >
                        <span className="file-tree-file-icon">
                            <FileIcon
                                fileName={name}
                                autoAssign={true}
                                width={18}
                                height={18}
                            />
                        </span>

                        <span className="file-tree-name">
                            {name}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="file-tree-more-button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuPath(
                                openMenuPath === fullPath
                                    ? null
                                    : fullPath
                            );
                        }}
                        title="More actions"
                    >
                        ⋮
                    </button>

                    {openMenuPath === fullPath && (
                        <div className="file-tree-action-menu">
                            <button
                                type="button"
                                onClick={() => handleRenameFile(value.__file)}
                            >
                                Rename
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await onDeleteFile(value.__file);
                                    setOpenMenuPath(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="file-tree">
            <div className="file-tree-toolbar">
                <button
                    type="button"
                    className="file-tree-toolbar-button"
                    onClick={handleCreateFile}
                    disabled={creatingFile}
                    title="Create file"
                >
                    {creatingFile ? "..." : "+ File"}
                </button>
                <button
                    type="button"
                    className="file-tree-toolbar-button"
                    onClick={handleCreateFolder}
                    disabled={creatingFolder}
                    title="Create folder"
                >
                    {creatingFolder
                        ? "..."
                        : "+ Folder"}
                </button>
                <button
                    type="button"
                    className="file-tree-toolbar-button file-tree-refresh-button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    title="Refresh Explorer"
                >
                    {refreshing ? "..." : "↻"}
                </button>
            </div>
            <div className="file-tree-content">
                {files.length === 0 ? (
                    <div className="file-tree-empty">
                        No files found.
                    </div>
                ) : (
                    renderTree(tree)
                )}
            </div>
        </div>
    );
};

export default FileTree;