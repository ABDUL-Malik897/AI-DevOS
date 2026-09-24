import "./WorkspaceCommandPalette.css";

const WorkspaceCommandPalette = ({
    showCommandPalette,
    setShowCommandPalette,
    commandPaletteQuery,
    setCommandPaletteQuery,
    filteredCommandPaletteCommands
}) => {
    if (!showCommandPalette) {
        return null;
    }

    return (
        <div
            className="workspace-command-palette-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    setShowCommandPalette(false);
                }
            }}
        >
            <div className="workspace-command-palette">
                <div className="workspace-command-palette-input-row">
                    <span className="workspace-command-palette-icon">
                        &gt;
                    </span>

                    <input
                        type="text"
                        value={commandPaletteQuery}
                        onChange={(event) => setCommandPaletteQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setShowCommandPalette(false);
                                return;
                            }
                            if (event.key === "Enter" && filteredCommandPaletteCommands.length > 0) {
                                filteredCommandPaletteCommands[0].action();
                            }
                        }}
                        autoFocus
                        placeholder="Type a command..."
                        className="workspace-command-palette-input"
                    />
                    <span className="workspace-command-palette-esc">
                        ESC
                    </span>
                </div>

                <div className="workspace-command-palette-list">
                    {filteredCommandPaletteCommands.length === 0 ? (
                        <div className="workspace-command-palette-empty">
                            No commands found
                        </div>
                    ) : (
                        filteredCommandPaletteCommands.map((command) => (
                            <button
                                key={command.id}
                                type="button"
                                className="workspace-command-palette-item"
                                onClick={command.action}
                            >
                                <span className="workspace-command-palette-item-icon">
                                    ›
                                </span>
                                <span className="workspace-command-palette-item-label">
                                    {command.label}
                                </span>
                                {command.shortcut && (
                                    <span className="workspace-command-palette-item-shortcut">
                                        {command.shortcut}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
                <div className="workspace-command-palette-footer">
                    <span>↑↓ navigate</span>
                    <span>Enter run</span>
                    <span>Esc close</span>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceCommandPalette;