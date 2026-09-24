import "./WorkspaceProblems.css";

const WorkspaceProblems = ({
    showProblems,
    setShowProblems,
    getProblems,
    openSource
}) => {
    if (!showProblems) {
        return null;
    }
    const problems = getProblems();

    return (
        <div className="workspace-problems-panel">
            <div className="workspace-problems-header">
                <div className="workspace-problems-title">
                    PROBLEMS
                </div>
                <div className="workspace-problems-summary">
                    {problems.length} problem
                    {problems.length !== 1 ? "s" : ""}
                </div>
                <button
                    type="button"
                    className="workspace-problems-close"
                    onClick={() => setShowProblems(false)}
                    title="Close problems"
                >
                    ×
                </button>
            </div>
            <div className="workspace-problems-body">
                {problems.length === 0 ? (
                    <div className="workspace-problems-empty">
                        <div className="workspace-problems-empty-icon">
                            ✓
                        </div>
                        <div>
                            No problems detected
                        </div>
                    </div>
                ) : (
                    problems.map((problem, index) => (
                        <button
                            key={`${problem.file}-${problem.line}-${index}`}
                            type="button"
                            className={`workspace-problem workspace-problem--${problem.severity}`}
                            onClick={() =>
                                openSource({
                                    filePath: problem.file?.replace(/\\/g,"/"),
                                    startLine: problem.line,
                                    endLine: problem.line
                                })
                            }
                        >

                            <div className="workspace-problem-icon">
                                {problem.severity === "critical" ? "●" : problem.severity === "warning" ? "▲" : "◆"}
                            </div>
                            <div className="workspace-problem-content">
                                <div className="workspace-problem-location">
                                    <span>
                                        {problem.file}
                                    </span>
                                    {problem.line && (
                                        <span>
                                            :{problem.line}
                                        </span>
                                    )}
                                </div>
                                <div className="workspace-problem-message">
                                    {problem.message}
                                </div>
                            </div>
                            <div className="workspace-problem-label">
                                {problem.label}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkspaceProblems;