import FileTree from "../../../../components/FileTree/FileTree";
import "./WorkspaceExplorer.css";

const WorkspaceExplorer = ({
    files,
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchingFiles,
    openSearchResult,
    requestFileSwitch,
    createNewFile,
    onRenameFile,
    onDeleteFile,
    onRenameFolder,
    onDeleteFolder,
    createNewFolder,
    refreshExplorer,
    creatingFile,
    creatingFolder,
    refreshing
}) => {
    return (
        <aside className="workspace-explorer">
            <div className="workspace-panel-heading">
                <span className="workspace-panel-title">
                    EXPLORER
                </span>
                <div className="workspace-panel-heading-actions">
                    <span className="workspace-panel-subtitle">
                        {files.length} files
                    </span>
                    <button
                        type="button"
                        className="workspace-search-trigger"
                        onClick={() => setShowSearch((previous) => !previous)}
                        title="Search project (Ctrl+Shift+F)"
                    >
                        ⌕
                    </button>
                </div>
            </div>

            <div className="workspace-file-tree">
                {showSearch && (
                    <div className="workspace-search-panel">
                        <div className="workspace-search-input-row">
                            <input
                                type="text"
                                className="workspace-search-input"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search in project..."
                                autoFocus
                            />

                            <button
                                type="button"
                                className="workspace-search-close"
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                }}
                                title="Close search"
                            >
                                ×
                            </button>
                        </div>
                        <div className="workspace-search-results">
                            {searchingFiles && (
                                <div className="workspace-search-status">
                                    Searching...
                                </div>
                            )}
                            {!searchingFiles &&
                                searchQuery.trim() &&
                                searchResults.length === 0 && (
                                    <div className="workspace-search-status">
                                        No results found
                                    </div>
                                )}
                            {!searchingFiles &&
                                searchResults.length > 0 && (
                                    <div className="workspace-search-count">
                                        {searchResults.length} result
                                        {searchResults.length !== 1 ? "s" : ""}
                                    </div>
                                )}

                            {searchResults.map((result, index) => (
                                <button
                                    key={`${result.file._id}-${result.lineNumber}-${index}`}
                                    type="button"
                                    className="workspace-search-result"
                                    onClick={() => openSearchResult(result)}
                                >
                                    <div className="workspace-search-result-location">
                                        <span>
                                            {result.file.path}
                                        </span>
                                        <span>
                                            :{result.lineNumber}
                                        </span>
                                    </div>
                                    <div className="workspace-search-result-line">
                                        {result.line}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <FileTree
                    files={files}
                    onFileSelect={requestFileSwitch}
                    onCreateFile={createNewFile}
                    onCreateFolder={createNewFolder}
                    onRefresh={refreshExplorer}
                    onDeleteFile={onDeleteFile}
                    onRenameFolder={onRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                    creatingFile={creatingFile}
                    onRenameFile={onRenameFile}
                    creatingFolder={creatingFolder}
                    refreshing={refreshing}
                />
            </div>
        </aside>
    );
};

export default WorkspaceExplorer;