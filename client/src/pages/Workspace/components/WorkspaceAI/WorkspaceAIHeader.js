import React from "react";
import "./WorkspaceAIHeader.css";

const WorkspaceAIHeader = ({
    setShowSourceControl,
    reviewProject,
    reviewing,
    diagnoseBuild,
    diagnosingBuild,
    runBuild,
    runningBuild,
    runTests,
    runningTests
}) => {
    return (
        <div className="workspace-ai-header">
            <div className="workspace-ai-title-row">
                <div className="workspace-ai-title">
                    <div className="workspace-ai-icon">
                        ✦
                    </div>
                    AI Assistant
                </div>
                <div className="workspace-ai-status">
                    <span className="workspace-ai-status-dot" />
                    READY
                </div>
            </div>
            <div className="workspace-ai-tools">
                <button
                    className="workspace-ai-tool workspace-source-control-button"
                    type="button"
                    onClick={() => setShowSourceControl(previous => !previous)}
                >
                    SOURCE CONTROL
                </button>

                <button
                    className="workspace-ai-tool"
                    type="button"
                    onClick={reviewProject}
                    disabled={reviewing}
                >
                    {reviewing ? "REVIEWING" : "REVIEW"}
                </button>

                <button
                    className="workspace-ai-tool"
                    type="button"
                    onClick={diagnoseBuild}
                    disabled={diagnosingBuild}
                >
                    {diagnosingBuild ? "DIAGNOSING" : "DIAGNOSE"}
                </button>

                <button
                    className="workspace-ai-tool"
                    type="button"
                    onClick={runBuild}
                    disabled={runningBuild}
                >
                    {runningBuild ? "BUILDING" : "BUILD"}
                </button>

                <button
                    className="workspace-ai-tool"
                    type="button"
                    onClick={runTests}
                    disabled={runningTests}
                >
                    {runningTests ? "TESTING" : "TEST"}
                </button>
            </div>
        </div>
    );
};

export default WorkspaceAIHeader;