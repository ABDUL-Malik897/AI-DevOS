import { DiffEditor } from "@monaco-editor/react";
import "./WorkspaceAIResults.css";

const WorkspaceAIResults = ({
    reviewResult,
    buildResult,
    buildDiagnosis,
    testResult,
    showFix,
    fixResult,
    showDiff,
    selectedCode,
    selectedFile,
    getLanguage,
    applyingFix,
    rejectFix,
    applyFix,
    showGeneration,
    generationResult,
    generationOriginal,
    applyingGeneration,
    rejectGeneratedCode,
    applyGeneratedCode,
    showMultiFileGeneration,
    multiFileResult,
    multiFileIndex,
    setMultiFileIndex,
    files,
    multiFileOriginalContents,
    applyingMultiFile,
    multiFileReview,
    setMultiFileReviewStatus,
    rejectMultiFileChanges,
    applyReviewedMultiFileChanges,
    showTestGeneration,
    testGenerationResult,
    applyingTests,
    rejectGeneratedTests,
    acceptGeneratedTests,
    showAgentPlan,
    agentPlan,
    rejectAgentPlan,
    openSource,
    executeAgent,
    executingAgent,
    agentExecutionResult,
    agentTaskHistory,
    showAgentHistory,
    setShowAgentHistory,
}) => {

    return (
        <>
            {reviewResult && (
                <div className="workspace-result">
                    <h3 className="workspace-result-title">
                        Code Review
                    </h3>
                    <p className="workspace-result-summary">
                        {reviewResult.summary}
                    </p>
                    {reviewResult.critical.length > 0 && (
                        <>
                            <div className="workspace-result-title">
                                🔴 Critical
                            </div>
                            {reviewResult.critical.map((issue, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="workspace-issue workspace-issue-critical"
                                    onClick={() => openSource({
                                        filePath: issue.file.replace(/\\/g, "/"),
                                        startLine: issue.line,
                                        endLine: issue.line
                                    })}
                                >
                                    <div className="workspace-issue-location">
                                        {issue.file.replace(/\\/g,"/")} : {issue.line}
                                    </div>
                                    <div className="workspace-issue-message">
                                        {issue.message}
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    {reviewResult.warnings.length > 0 && (
                        <>
                            <div className="workspace-result-title">
                                🟠 Warnings
                            </div>
                            {reviewResult.warnings.map((issue, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="workspace-issue workspace-issue-warning"
                                    onClick={() => openSource({
                                        filePath: issue.file.replace(/\\/g,"/"),
                                        startLine: issue.line,
                                        endLine: issue.line
                                    })}
                                >
                                    <div className="workspace-issue-location">
                                        {issue.file.replace(/\\/g,"/")} : {issue.line}
                                    </div>
                                    <div className="workspace-issue-message">
                                        {issue.message}
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    {reviewResult.improvements.length > 0 && (
                        <>
                            <div className="workspace-result-title">
                                💡 Improvements
                            </div>
                            {reviewResult.improvements.map((issue, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="workspace-issue workspace-issue-improvement"
                                    onClick={() => openSource({
                                        filePath: issue.file.replace(/\\/g,"/"),
                                        startLine: issue.line,
                                        endLine: issue.line
                                    })}
                                >
                                    <div className="workspace-issue-location">
                                        {issue.file.replace(/\\/g, "/")} : {issue.line}
                                    </div>
                                    <div className="workspace-issue-message">
                                        {issue.message}
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {buildResult && (
                <div className="workspace-result">
                    <h3 className="workspace-result-title">
                        Build Result
                    </h3>
                    <p className="workspace-result-summary">
                        <strong>Status:</strong>{" "}
                        {buildResult.success ? "✅ Build Passed" : "❌ Build Failed"}
                        <br />
                        <strong>Command:</strong>{" "}
                        npm run {buildResult.command}
                        <br />
                        <strong>Exit Code:</strong>{" "}
                        {buildResult.exitCode}
                    </p>
                    {buildResult.stdout && (
                        <>
                            <div className="workspace-result-title">
                                Output
                            </div>
                            <pre className="workspace-output">
                                {buildResult.stdout}
                            </pre>
                        </>
                    )}
                    {buildResult.stderr && (
                        <>
                            <div className="workspace-result-title">
                                Error
                            </div>
                            <pre className="workspace-output workspace-output-error">
                                {buildResult.stderr}
                            </pre>
                        </>
                    )}
                </div>
            )}

            {buildDiagnosis && (
                <div className="workspace-result">
                    <h3 className="workspace-result-title">
                        Build Diagnosis
                    </h3>
                    <p className="workspace-result-summary">
                        {buildDiagnosis.summary}
                    </p>
                    {buildDiagnosis.file && (
                        <button
                            type="button"
                            className="workspace-issue workspace-issue-warning"
                            onClick={() => openSource({
                                filePath: buildDiagnosis.file.replace(/\\/g,"/"),
                                startLine: buildDiagnosis.line,
                                endLine: buildDiagnosis.line
                            })}
                        >
                            <div className="workspace-issue-location">
                                {buildDiagnosis.file.replace(/\\/g, "/")} : {buildDiagnosis.line}
                            </div>
                        </button>
                    )}
                    <p className="workspace-result-summary">
                        {buildDiagnosis.message}
                    </p>
                    <p className="workspace-result-summary">
                        <strong>Suggested fix:</strong>{" "}
                        {buildDiagnosis.suggestion}
                    </p>
                </div>
            )}

            {testResult && (
                <div className="workspace-result">
                    <h3 className="workspace-result-title">
                        Test Result
                    </h3>
                    <p className="workspace-result-summary">
                        <strong>Status:</strong>{" "}
                        {testResult.success ? "✅ Tests Passed" : "❌ Tests Failed"}
                        <br />
                        <strong>Command:</strong>{" "}
                        npm test
                        <br />
                        <strong>Exit Code:</strong>{" "}
                        {testResult.exitCode}
                    </p>
                    {testResult.stdout && (
                        <>
                            <div className="workspace-result-title">
                                Output
                            </div>
                            <pre className="workspace-output">
                                {testResult.stdout}
                            </pre>
                        </>
                    )}

                    {testResult.stderr && (
                        <>
                            <div className="workspace-result-title">
                                Error
                            </div>
                            <pre className="workspace-output workspace-output-error">
                                {testResult.stderr}
                            </pre>
                        </>
                    )}
                </div>
            )}

            {showFix && fixResult && (
                <div className="workspace-result workspace-ai-fix-result">
                    <div className="workspace-ai-fix-header">
                        <div>
                            <h3 className="workspace-result-title">
                                AI Fix
                            </h3>
                            <p className="workspace-result-summary">
                                {fixResult.explanation}
                            </p>
                        </div>
                        <div className="workspace-ai-fix-status">
                            PREVIEW
                        </div>
                    </div>

                    {showDiff && (
                        <div className="workspace-diff-wrapper">
                            <div className="workspace-diff-labels">
                                <span>ORIGINAL</span>
                                <span>PROPOSED</span>
                            </div>
                            <div className="workspace-diff-editor">
                                <DiffEditor
                                    height="360px"
                                    original={selectedCode || ""}
                                    modified={fixResult.fixedCode || ""}
                                    language={selectedFile ? getLanguage(selectedFile.extension) : "plaintext"}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: {enabled: false},
                                        renderSideBySide: true,
                                        automaticLayout: true,
                                        fontSize: 13,
                                        wordWrap: "on",
                                        scrollBeyondLastLine: false
                                    }}
                                />
                            </div>
                            <div className="workspace-diff-actions">
                                <button
                                    type="button"
                                    className="workspace-diff-reject"
                                    onClick={rejectFix}
                                    disabled={applyingFix}
                                >
                                    {applyingFix
                                        ? "Please wait..."
                                        : "Reject"}
                                </button>

                                <button
                                    type="button"
                                    className="workspace-diff-accept"
                                    onClick={applyFix}
                                    disabled={applyingFix}
                                >
                                    {applyingFix
                                        ? "Applying..."
                                        : "Accept & Save"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showGeneration && generationResult && (
                <div className="workspace-result workspace-ai-generation-result">
                    <div className="workspace-ai-fix-header">
                        <div>
                            <h3 className="workspace-result-title">
                                AI Code Generation
                            </h3>
                            <p className="workspace-result-summary">
                                {generationResult.explanation}
                            </p>
                        </div>
                        <div className="workspace-ai-fix-status">
                            PREVIEW
                        </div>
                    </div>
                    <div className="workspace-diff-wrapper">
                        <div className="workspace-diff-labels">
                            <span>
                                {generationOriginal ? "ORIGINAL SELECTION" : "INSERT AT CURSOR"}
                            </span>
                            <span>GENERATED</span>
                        </div>
                        <div className="workspace-diff-editor">
                            <DiffEditor
                                height="360px"
                                original={generationOriginal}
                                modified={generationResult.code}
                                keepCurrentOriginalModel={true}
                                keepCurrentModifiedModel={true}
                                language={selectedFile ? getLanguage(selectedFile.extension) : "plaintext"}
                                theme="vs-dark"
                                options={{
                                    readOnly: true,
                                    minimap: {enabled: false},
                                    renderSideBySide: true,
                                    automaticLayout: true,
                                    fontSize: 13,
                                    wordWrap: "on",
                                    scrollBeyondLastLine: false
                                }}
                            />
                        </div>

                        <div className="workspace-diff-actions">
                            <button
                                type="button"
                                className="workspace-diff-reject"
                                onClick={rejectGeneratedCode}
                                disabled={
                                    applyingGeneration
                                }
                            >
                                Reject
                            </button>

                            <button
                                type="button"
                                className="workspace-diff-accept"
                                onClick={applyGeneratedCode}
                                disabled={
                                    applyingGeneration
                                }
                            >
                                {applyingGeneration
                                    ? "Applying..."
                                    : "Accept & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMultiFileGeneration && multiFileResult && multiFileResult.changes?.length > 0 && (
                <div className="workspace-result workspace-ai-multi-generation">
                    <div className="workspace-ai-fix-header">
                        <div>
                            <h3 className="workspace-result-title">
                                AI Multi-File Changes
                            </h3>
                            <p className="workspace-result-summary">
                                {multiFileResult.summary}
                            </p>
                        </div>
                        <div className="workspace-ai-fix-status">
                            REVIEW
                        </div>
                    </div>
                    <div className="workspace-multi-file-list">
                        {multiFileResult.changes.map((change, index) => (
                            <button
                                key={`${change.filePath}-${index}`}
                                type="button"
                                className={multiFileIndex === index
                                    ? "workspace-multi-file-item workspace-multi-file-item-active"
                                    : "workspace-multi-file-item"
                                }
                                onClick={() => setMultiFileIndex(index)}
                            >
                                <span
                                    className={change.action === "create"
                                        ? "workspace-multi-file-action workspace-multi-file-action-create"
                                        : "workspace-multi-file-action"
                                    }
                                >
                                    {change.action === "create" ? "+" : "M"}
                                </span>
                                <span className="workspace-multi-file-path">
                                    {change.filePath}
                                </span>
                            </button>
                        ))}
                    </div>
                    {(() => {
                        const change = multiFileResult.changes[multiFileIndex];
                        if (!change) {
                            return null;
                        }
                        const existingFile = files.find((file) => file.path.replace( /\\/g, "/") === change.filePath.replace(/\\/g, "/"));
                        let originalContent = "";
                        if (existingFile) {
                            const normalizedPath = change.filePath.replace(/\\/g, "/");
                            originalContent = multiFileOriginalContents?.[normalizedPath] || "";
                        }

                        return (
                            <div className="workspace-multi-file-preview">
                                <div className="workspace-diff-labels">
                                    <span>
                                        {change.action === "create" ? "NEW FILE" : "CURRENT"}
                                    </span>
                                    <span>
                                        PROPOSED
                                    </span>
                                </div>
                                <div className="workspace-diff-editor">
                                    <DiffEditor
                                        height="320px"
                                        original={originalContent}
                                            modified={change.content}
                                            keepCurrentOriginalModel={true}
                                            keepCurrentModifiedModel={true}
                                            language={getLanguage(existingFile?.extension || "." + (change.filePath.split(".").pop() || ""))}
                                            theme="vs-dark"
                                            options={{
                                                readOnly: true,
                                                minimap: {enabled: false},
                                                renderSideBySide: true,
                                                automaticLayout: true,
                                                fontSize: 12,
                                                wordWrap: "on",
                                                scrollBeyondLastLine: false
                                            }}
                                        />
                                </div>
                                <div className="workspace-multi-file-reason">
                                    <strong>WHY</strong>
                                    <span>
                                        {change.reason}
                                    </span>
                                </div>
                                <div className="workspace-multi-file-navigation">
                                    <button
                                        type="button"
                                        onClick={() => setMultiFileIndex((previous) => Math.max(0, previous - 1))}
                                            disabled={multiFileIndex === 0 || applyingMultiFile}
                                    >
                                        ← PREVIOUS
                                    </button>
                                    <span>
                                        {multiFileIndex + 1}{" / "}{multiFileResult.changes.length}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setMultiFileIndex((previous) => Math.min(multiFileResult.changes.length - 1, previous + 1))}
                                            disabled={multiFileIndex === multiFileResult.changes.length - 1 || applyingMultiFile}
                                    >
                                        NEXT →
                                    </button>
                                </div>
                                <div className="workspace-multi-file-review-status">
                                    <strong>REVIEW STATUS</strong>
                                    <span>
                                        {(() => {
                                            const normalizedPath = change.filePath.replace(/\\/g, "/");
                                            const status = multiFileReview[normalizedPath] || "pending";
                                            return status === "accepted" ? "Accepted"
                                                    : status === "rejected"
                                                        ? "Rejected"
                                                        : "Not reviewed";
                                        })()}
                                    </span>
                                </div>
                                <div className="workspace-diff-actions">
                                    <button
                                        type="button"
                                        className="workspace-diff-reject"
                                        onClick={() => {setMultiFileReviewStatus(change.filePath, "rejected")}}
                                            disabled={applyingMultiFile}
                                    >
                                        REJECT FILE
                                    </button>
                                    <button
                                        type="button"
                                        className="workspace-diff-accept"
                                        onClick={() => {setMultiFileReviewStatus(change.filePath, "accepted")}}
                                        disabled={applyingMultiFile}
                                    >
                                        ACCEPT FILE
                                    </button>
                                    <button
                                        type="button"
                                        className="workspace-secondary-button"
                                        onClick={rejectMultiFileChanges}
                                        disabled={applyingMultiFile}
                                    >
                                        REJECT ALL
                                    </button>
                                    <button
                                        type="button"
                                        className="workspace-primary-button"
                                        onClick={applyReviewedMultiFileChanges}
                                        disabled={applyingMultiFile}
                                    >
                                        {applyingMultiFile ? "APPLYING..." : "APPLY REVIEWED"}
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {showTestGeneration && testGenerationResult && (
                <div className="workspace-result workspace-test-generation">
                    <div className="workspace-ai-fix-header">
                        <div>
                            <h3 className="workspace-result-title">
                                Generated Tests
                            </h3>
                            <p className="workspace-result-summary">
                                {testGenerationResult.explanation}
                            </p>
                        </div>
                        <div className="workspace-ai-fix-status">
                            PREVIEW
                        </div>
                    </div>
                    <div className="workspace-result-summary">
                        <strong>Test File:</strong>{" "}
                        {testGenerationResult.testFilePath}
                        <br />
                        <strong>Framework:</strong>{" "}
                        {testGenerationResult.framework}
                    </div>
                    <div className="workspace-diff-wrapper">
                        <div className="workspace-diff-labels">
                            <span>EMPTY</span>
                            <span>GENERATED</span>
                        </div>
                        <div className="workspace-diff-editor">
                            <DiffEditor
                                height="420px"
                                original=""
                                modified={testGenerationResult.code}
                                keepCurrentOriginalModel={true}
                                keepCurrentModifiedModel={true}
                                language={getLanguage("." + (testGenerationResult.testFilePath.split(".").pop() || ""))}
                                theme="vs-dark"
                                options={{
                                    readOnly: true,
                                    minimap: {enabled: false},
                                    renderSideBySide: true,
                                    automaticLayout: true,
                                    fontSize: 12,
                                    wordWrap: "on",
                                    scrollBeyondLastLine: false
                                }}
                            />
                        </div>
                    </div>
                    <div className="workspace-action-row">
                        <button
                            type="button"
                            className="workspace-secondary-button"
                            onClick={rejectGeneratedTests}
                            disabled={applyingTests}
                        >
                            REJECT
                        </button>
                        <button
                            type="button"
                            className="workspace-primary-button"
                            onClick={acceptGeneratedTests}
                            disabled={applyingTests}
                        >
                            {applyingTests ? "SAVING..." : "ACCEPT & SAVE"}
                        </button>
                    </div>
                </div>
            )}

            {showAgentPlan && agentPlan && (
                <div className="workspace-result workspace-agent-plan">
                    <div className="workspace-ai-fix-header">
                        <div>
                            <h3 className="workspace-result-title">
                                AI Agent Plan
                            </h3>
                            <p className="workspace-result-summary">
                                {agentPlan.summary}
                            </p>
                        </div>
                        <div className="workspace-ai-fix-status">
                            PLAN
                        </div>
                    </div>
                    <div className="workspace-agent-steps">
                        {agentPlan.steps.map((step, index) => (
                            <div
                                key={`${step.step}-${index}`}
                                className="workspace-agent-step"
                            >
                                <div className="workspace-agent-step-number">
                                    {step.step}
                                </div>
                                <div className="workspace-agent-step-content">
                                    <div className="workspace-agent-step-description">
                                        {step.description}
                                    </div>
                                    {step.files?.length > 0 && (
                                        <div className="workspace-agent-step-files">
                                            <span className="workspace-agent-step-label">
                                                FILES
                                            </span>
                                            {step.files.map((file, fileIndex) => (
                                                <span
                                                    key={`${file}-${fileIndex}`}
                                                    className="workspace-agent-file"
                                                >
                                                    {file}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="workspace-agent-step-reason">
                                        <strong>
                                            WHY
                                        </strong>
                                        <span>
                                            {step.reason}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="workspace-action-row">
                        <button
                            type="button"
                            className="workspace-secondary-button"
                            onClick={rejectAgentPlan}
                        >
                            REJECT
                        </button>
                        <button
                            type="button"
                            className="workspace-primary-button"
                            onClick={executeAgent}
                            disabled={executingAgent}
                        >
                            {executingAgent ? "EXECUTING..." : "EXECUTE PLAN"}
                        </button>
                    </div>
                </div>
            )}

            {agentExecutionResult && (
                <div className="workspace-result workspace-agent-execution">
                    <div className="workspace-ai-fix-header">
                        <div>
                            <h3 className="workspace-result-title">
                                Agent Execution
                            </h3>
                            <p className="workspace-result-summary">
                                {agentExecutionResult.status === "completed"
                                    ? "The agent completed the task successfully."
                                    : "The agent could not complete the task."
                                }
                            </p>
                        </div>
                        <div className="workspace-ai-fix-status">
                            {agentExecutionResult.status === "completed" ? "SUCCESS" : "FAILED"}
                        </div>
                    </div>
                    <div className="workspace-agent-execution-attempts">
                        {(agentExecutionResult.attempts || []).map((attempt) => (
                            <div
                                key={attempt.attempt}
                                className="workspace-agent-execution-attempt"
                            >
                                <div className="workspace-agent-step-number">
                                    {attempt.attempt}
                                </div>
                                <div className="workspace-agent-step-content">
                                    <div className="workspace-agent-step-description">
                                        Attempt {attempt.attempt}
                                    </div>
                                    <div className="workspace-agent-step-reason">
                                        <strong>
                                            STATUS
                                        </strong>
                                        <span>
                                            {agentExecutionResult.verification?.success ? "Tests passed" : "Tests failed"}
                                        </span>
                                    </div>
                                    {attempt.execution?.summary && (
                                        <div className="workspace-agent-step-reason">
                                            <strong>
                                                EXECUTION
                                            </strong>
                                            <span>
                                                {attempt.execution.summary}
                                            </span>
                                        </div>
                                    )}
                                    {attempt.diagnosis && (
                                        <div className="workspace-agent-step-reason">
                                            <strong>
                                                DIAGNOSIS
                                            </strong>
                                            <span>
                                                {attempt.diagnosis.summary || attempt.diagnosis.message || "Build/test failure detected."}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {agentExecutionResult.verification && (
                        <div className="workspace-output">
                            <strong>
                                TEST OUTPUT
                            </strong>
                            <pre>
                                {[agentExecutionResult.verification.stdout, agentExecutionResult.verification.stderr].filter(Boolean).join("\n")}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            
        </>
    );
};

export default WorkspaceAIResults;