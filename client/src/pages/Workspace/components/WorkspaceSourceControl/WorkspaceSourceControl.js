import React from "react";
import "./WorkspaceSourceControl.css";

const WorkspaceSourceControl = ({
    showSourceControl,
    gitStatus,
    loadingGit,
    loadGitStatus,
    loadGitBranches,
    loadGitHistory,
    showGitBranches,
    setShowGitBranches,
    showGitHistory,
    setShowGitHistory,
    newBranchName,
    setNewBranchName,
    createGitBranch,
    loadingGitBranches,
    gitBranches,
    checkoutGitBranch,
    gitHistory,
    loadingGitHistory,
    gitActionLoading,
    stageGitFile,
    unstageGitFile,
    commitMessage,
    setCommitMessage,
    commitGitChanges,
    pullGitChanges,
    pushGitChanges,
    selectedGitFile,
    setSelectedGitFile,
    gitDiff,
    setGitDiff,
    openGitDiff
}) => {
    if (!showSourceControl) {
        return null;
    }

    return (
        <div className="workspace-source-control">
            <div className="workspace-source-control-header">
                <div>
                    <div className="workspace-source-control-title">
                        SOURCE CONTROL
                    </div>
                    {gitStatus && (
                        <div className="workspace-source-control-branch">
                            ⎇ {gitStatus.branch || "unknown"}
                            {gitStatus.ahead > 0 && (
                                <span>
                                    {" "}↑{gitStatus.ahead}
                                </span>
                            )}
                            {gitStatus.behind > 0 && (
                                <span>
                                    {" "}↓{gitStatus.behind}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="workspace-source-control-refresh"
                    onClick={() => {
                        loadGitStatus();
                        loadGitBranches();
                        loadGitHistory();
                    }}
                    disabled={loadingGit}
                >
                    ↻
                </button>
            </div>
            <div className="workspace-git-toolbar">
                <button
                    type="button"
                    onClick={() => setShowGitBranches(previous => !previous)}
                >
                    BRANCH
                </button>
                <button
                    type="button"
                    onClick={() => setShowGitHistory(previous => !previous)}
                >
                    HISTORY
                </button>
            </div>
            {showGitBranches && (
                <div className="workspace-git-branches">
                    <div className="workspace-git-section-title">
                        BRANCHES
                    </div>
                    <div className="workspace-git-new-branch">
                        <input
                            type="text"
                            value={newBranchName}
                            onChange={(event) => setNewBranchName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    createGitBranch();
                                }
                            }}
                            placeholder="New branch name..."
                            disabled={gitActionLoading}
                        />
                        <button
                            type="button"
                            onClick={createGitBranch}
                            disabled={
                                gitActionLoading ||
                                !newBranchName.trim()
                            }
                        >
                            +
                        </button>
                    </div>
                    <div className="workspace-git-branch-list">
                        {loadingGitBranches ? (
                            <div className="workspace-source-control-loading">
                                Loading branches...
                            </div>
                        ) : (
                            gitBranches.map((branch) => (
                                <button
                                    key={branch.name}
                                    type="button"
                                    className={
                                        branch.current
                                            ? "workspace-git-branch workspace-git-branch-active"
                                            : "workspace-git-branch"
                                    }
                                    onClick={() => checkoutGitBranch(branch.name)}
                                    disabled={gitActionLoading}
                                >
                                    <span>
                                        {branch.current ? "●" : "○"}
                                    </span>
                                    <span>
                                        {branch.name}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
            {showGitHistory && (
                <div className="workspace-git-history">
                    <div className="workspace-git-section-title">
                        COMMIT HISTORY
                    </div>
                    {loadingGitHistory ? (
                        <div className="workspace-source-control-loading">
                            Loading history...
                        </div>
                    ) : gitHistory.length === 0 ? (
                        <div className="workspace-source-control-empty">
                            No commits found
                        </div>
                    ) : (
                        gitHistory.map((commit) => (
                            <div
                                key={commit.hash}
                                className="workspace-git-commit"
                            >
                                <div className="workspace-git-commit-hash">
                                    {commit.abbreviatedHash}
                                </div>
                                <div className="workspace-git-commit-message">
                                    {commit.message}
                                </div>
                                <div className="workspace-git-commit-meta">
                                    {commit.author}
                                    {" · "}
                                    {new Date(commit.date).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            {!loadingGit && (
                <>
                    <div className="workspace-git-section">
                        <div className="workspace-git-section-header">
                            <span>
                                STAGED CHANGES
                            </span>
                            <span>
                                {(gitStatus?.files || []).filter(file => file.staged).length}
                            </span>
                        </div>
                        {(gitStatus?.files || []).filter(file => file.staged).map((file, index) => (
                            <div
                                key={`staged-${file.path}-${index}`}
                                className="workspace-git-file-row"
                            >
                                <button
                                    type="button"
                                    className="workspace-source-control-file"
                                    onClick={() => openGitDiff(file, true)}
                                >
                                    <span
                                        className={`workspace-git-status workspace-git-status--${file.status}`}
                                    >
                                        {getGitStatusSymbol(file.status)}
                                    </span>
                                    <span className="workspace-source-control-file-path">
                                        {file.path}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="workspace-git-file-action"
                                    onClick={() => unstageGitFile(file)}
                                    disabled={gitActionLoading}
                                    title="Unstage"
                                >
                                    −
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="workspace-git-section">
                        <div className="workspace-git-section-header">
                            <span>
                                CHANGES
                            </span>
                            <span>
                                {(gitStatus?.files || []).filter(file => file.unstaged).length}
                            </span>
                        </div>
                        {(gitStatus?.files || []).filter(file => file.unstaged).map((file, index) => (
                            <div
                                key={`unstaged-${file.path}-${index}`}
                                className="workspace-git-file-row"
                            >
                                <button
                                    type="button"
                                    className="workspace-source-control-file"
                                    onClick={() => openGitDiff(file, false)}
                                >
                                    <span
                                        className={`workspace-git-status workspace-git-status--${file.status}`}
                                    >
                                        {getGitStatusSymbol(file.status)}
                                    </span>
                                    <span className="workspace-source-control-file-path">
                                        {file.path}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="workspace-git-file-action"
                                    onClick={() => stageGitFile(file)}
                                    disabled={gitActionLoading}
                                    title="Stage"
                                >
                                    +
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="workspace-source-control-commit">
                        <input
                            type="text"
                            value={commitMessage}
                            onChange={(event) => setCommitMessage(event.target.value)}
                            placeholder="Commit staged changes..."
                            disabled={gitActionLoading}
                        />
                        <button
                            type="button"
                            onClick={commitGitChanges}
                            disabled={gitActionLoading || !(gitStatus?.files || []).some(file => file.staged)
                            }
                        >
                            {gitActionLoading ? "WORKING..." : "COMMIT"}
                        </button>
                    </div>
                    <div className="workspace-source-control-git-actions">
                        <button
                            type="button"
                            onClick={pullGitChanges}
                            disabled={gitActionLoading}
                        >
                            PULL
                        </button>
                        <button
                            type="button"
                            onClick={pushGitChanges}
                            disabled={gitActionLoading}
                        >
                            PUSH
                        </button>
                    </div>
                </>
            )}
            {selectedGitFile && (
                <div className="workspace-git-diff">
                    <div className="workspace-git-diff-header">
                        <span>
                            {selectedGitFile.path}
                            {" · "}
                            {selectedGitFile.diffStaged ? "STAGED" : "WORKTREE"}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedGitFile(null);
                                setGitDiff("");
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <pre>
                        {gitDiff || "No diff available."}
                    </pre>
                </div>
            )}
        </div>
    );
};

const getGitStatusSymbol = (status) => {
    switch (status) {
        case "modified":
            return "M";
        case "added":
            return "A";
        case "deleted":
            return "D";
        case "renamed":
            return "R";
        default:
            return "?";
    }
};

export default WorkspaceSourceControl;