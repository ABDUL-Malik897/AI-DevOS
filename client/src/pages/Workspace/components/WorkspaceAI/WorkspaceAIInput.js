import React from "react";
import "./WorkspaceAIInput.css";

const WorkspaceAIInput = ({
    selectedCode,
    asking,
    explaining,
    fixing,
    question,
    setQuestion,
    askAI,
    explainSelectedCode,
    fixSelectedCode,
    generatingCode,
    generateCodeFromPrompt,
    generatingMultiFile,
    generateMultiFileFromPrompt,
    generatingTests,
    generateTestsFromFile,
    planningAgent,
    generateAgentPlan,
    aiInputRef,
    onCancelEdit,
    selectedFile
}) => {
    return (
        <div className="workspace-ai-input-area">
            {selectedCode.trim() && (
                <div className="workspace-selection-actions">
                    <button
                        type="button"
                        className="workspace-selection-button"
                        onClick={explainSelectedCode}
                        disabled={asking || explaining}
                    >
                        {explaining ? "EXPLAINING..." : "Explain Selection"}
                    </button>
                    <button
                        type="button"
                        className="workspace-selection-button"
                        onClick={fixSelectedCode}
                        disabled={asking || fixing}
                    >
                        {fixing ? "FIXING..." : "Fix Selection"}
                    </button>
                </div>
            )}
            <form
                className="workspace-ai-form"
                onSubmit={askAI}
            >
                <input
                    ref={aiInputRef}
                    className="workspace-ai-input"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask or describe code to generate..."
                />

                <div className="workspace-ai-button-group">
                    <button
                        className="workspace-ai-send"
                        type="submit"
                        disabled={asking || generatingCode}
                    >
                        {asking ? "ASKING..." : "ASK"}
                    </button>

                    <button
                        type="button"
                        onClick={onCancelEdit}
                    >
                        Cancel Edit
                    </button>

                    <button
                        className="workspace-ai-generate"
                        type="button"
                        onClick={generateCodeFromPrompt}
                        disabled={asking || generatingCode || !selectedFile}
                    >
                        {generatingCode ? "GENERATING..." : "GENERATE"}
                    </button>

                    <button
                        className="workspace-ai-generate workspace-ai-generate-multi"
                        type="button"
                        onClick={generateMultiFileFromPrompt}
                        disabled={asking || generatingCode || generatingMultiFile || !selectedFile}
                    >
                        {generatingMultiFile ? "ANALYZING..." : "MULTI-FILE"}
                    </button>

                    <button
                        type="button"
                        className="workspace-ai-generate"
                        onClick={generateTestsFromFile}
                        disabled={generatingTests || !selectedFile}
                    >
                        {generatingTests ? "GENERATING..." : "GENERATE TESTS"}
                    </button>

                    <button
                        type="button"
                        className="workspace-ai-generate"
                        onClick={generateAgentPlan}
                        disabled={planningAgent}
                    >
                        {planningAgent ? "PLANNING..." : "AGENT"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WorkspaceAIInput;