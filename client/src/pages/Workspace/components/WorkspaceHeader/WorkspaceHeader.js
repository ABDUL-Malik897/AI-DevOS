import React from "react";
import "./WorkspaceHeader.css";

const WorkspaceHeader = ({
    project,
    navigate,
    saveMessage,
    isDirty,
    selectedFile,
    savingFile,
    requestSave
}) => {
    return (
        <header className="workspace-topbar">
            <div className="workspace-topbar-left">
                <button
                    className="workspace-back-button"
                    onClick={() => navigate("/projects")}
                >
                    ←
                    <span>Projects</span>
                </button>
                <div className="workspace-brand">
                    <div className="workspace-brand-icon">
                        {">_"}
                    </div>
                    <div className="workspace-brand-name">
                        AI<span>DevOS</span>
                    </div>
                </div>
                <div className="workspace-project-divider" />
                <div className="workspace-project-info">
                    <div className="workspace-project-name">
                        {project?.name}
                    </div>
                    <div className="workspace-project-repo">
                        {project?.githubFullName}
                    </div>
                </div>
            </div>
            <div className="workspace-topbar-right">

                <div className="workspace-save-status">
                    {saveMessage && (
                        <span className="workspace-save-message">
                            ✓ {saveMessage}
                        </span>
                    )}

                    {isDirty && !saveMessage && (
                        <span className="workspace-unsaved-indicator">
                            ● UNSAVED
                        </span>
                    )}

                </div>
                <div className="workspace-online">
                    <span className="workspace-online-dot" />
                    WORKSPACE ONLINE
                </div>

                <button
                    type="button"
                    className={`workspace-save-button ${
                        isDirty
                            ? "workspace-save-button--dirty"
                            : ""
                    }`}
                    onClick={requestSave}
                    disabled={!selectedFile || savingFile}
                >
                    {savingFile ? "SAVING..." : "SAVE"}
                </button>

                <button
                    className="workspace-projects-button"
                    onClick={() => navigate("/projects")}
                >
                    Project Manager
                </button>

            </div>

        </header>
    );
};

export default WorkspaceHeader;