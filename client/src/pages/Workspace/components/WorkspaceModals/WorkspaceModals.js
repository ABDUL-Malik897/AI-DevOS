import React from "react";
import "./WorkspaceModals.css";

const WorkspaceModals = ({
    showSaveConfirm,
    selectedFile,
    savingFile,
    cancelSave,
    confirmSave,
    showSwitchConfirm,
    pendingFile,
    switchingFile,
    cancelFileSwitch,
    discardAndSwitchFile,
    saveAndSwitchFile
}) => {
    return (
        <>
            {showSaveConfirm && (
                <div className="workspace-modal-overlay">
                    <div className="workspace-save-modal">
                        <div className="workspace-save-modal-icon">
                            💾
                        </div>

                        <div className="workspace-save-modal-content">
                            <span className="workspace-save-modal-label">
                                SAVE CHANGES
                            </span>

                            <h3>
                                Save this file?
                            </h3>

                            <p>
                                Are you sure you want to save the current changes to{" "}
                                <strong>
                                    {selectedFile?.path}
                                </strong>
                                ?
                            </p>
                        </div>

                        <div className="workspace-save-modal-actions">
                            <button
                                type="button"
                                className="workspace-save-modal-cancel"
                                onClick={cancelSave}
                                disabled={savingFile}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="workspace-save-modal-confirm"
                                onClick={confirmSave}
                                disabled={savingFile}
                            >
                                {savingFile ? "Saving..." : "Yes, Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSwitchConfirm && pendingFile && (
                <div className="workspace-modal-overlay">
                    <div className="workspace-save-modal workspace-switch-modal">
                        <div className="workspace-save-modal-icon">
                            ⚠
                        </div>

                        <div className="workspace-save-modal-content">
                            <span className="workspace-save-modal-label">
                                UNSAVED CHANGES
                            </span>

                            <h3>
                                Save changes before switching?
                            </h3>

                            <p>
                                You have unsaved changes in{" "}
                                <strong>
                                    {selectedFile?.path}
                                </strong>
                                . What would you like to do?
                            </p>
                        </div>

                        <div className="workspace-save-modal-actions">
                            <button
                                type="button"
                                className="workspace-save-modal-cancel"
                                onClick={cancelFileSwitch}
                                disabled={switchingFile}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="workspace-switch-discard"
                                onClick={discardAndSwitchFile}
                                disabled={switchingFile}
                            >
                                Discard
                            </button>
                            <button
                                type="button"
                                className="workspace-save-modal-confirm"
                                onClick={saveAndSwitchFile}
                                disabled={switchingFile}
                            >
                                {switchingFile ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WorkspaceModals;