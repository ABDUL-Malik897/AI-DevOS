import "./WorkspaceTerminal.css";

const WorkspaceTerminal = ({
    showTerminal,
    setShowTerminal,
    clearTerminal,
    runningTerminal,
    terminalOutput,
    terminalInput,
    setTerminalInput,
    runTerminal
}) => {
    if (!showTerminal) {
        return null;
    }

    return (
        <div className="workspace-terminal-panel">
            <div className="workspace-terminal-header">
                <div className="workspace-terminal-title">
                    TERMINAL
                </div>
                <div className="workspace-terminal-actions">
                    <button
                        type="button"
                        className="workspace-terminal-clear"
                        onClick={clearTerminal}
                        disabled={
                            runningTerminal ||
                            terminalOutput.length === 0
                        }
                    >
                        CLEAR
                    </button>
                    <button
                        type="button"
                        className="workspace-terminal-close"
                        onClick={() => setShowTerminal(false)}
                        title="Close terminal"
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className="workspace-terminal-output">
                {terminalOutput.length === 0 ? (
                    <div className="workspace-terminal-empty">
                        Integrated terminal ready.
                    </div>
                ) : (
                    terminalOutput.map((entry, index) => (
                        <div
                            key={index}
                            className={`workspace-terminal-line workspace-terminal-line--${entry.type}`}
                        >
                            {entry.text}
                        </div>
                    ))
                )}
                {runningTerminal && (
                    <div className="workspace-terminal-running">
                        Running command...
                    </div>
                )}
            </div>
            <form
                className="workspace-terminal-form"
                onSubmit={runTerminal}
            >
                <span className="workspace-terminal-prompt">
                    &gt;
                </span>
                <input
                    type="text"
                    value={terminalInput}
                    onChange={(event) => setTerminalInput(event.target.value)}
                    className="workspace-terminal-input"
                    placeholder="Enter a command..."
                    disabled={runningTerminal}
                    autoFocus
                />

                <button
                    type="submit"
                    className="workspace-terminal-run"
                    disabled={
                        runningTerminal ||
                        !terminalInput.trim()
                    }
                >
                    {runningTerminal ? "..." : "RUN"}
                </button>
            </form>
        </div>
    );
};

export default WorkspaceTerminal;