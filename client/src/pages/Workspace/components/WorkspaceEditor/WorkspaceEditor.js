import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import "./WorkspaceEditor.css";

const WorkspaceEditor = ({
    openTabs,
    selectedFile,
    dirtyTabs,
    switchToTab,
    closeTab,
    undoEditor,
    redoEditor,
    getProblems,
    setEditorProblems,
    showTerminal,
    setShowProblems,
    setShowTerminal,
    editorRef,
    selectionRef,
    setSelectedCode,
    setFileContent,
    setIsDirty,
    setSaveMessage,
    setTabContents,
    setDirtyTabs,
    fileContent,
    getLanguage
}) => {

    const editorContainerRef = useRef(null);
    useEffect(() => {
    const container = editorContainerRef.current;
    const editor = editorRef.current;

    if (!container || !editor) {
        return;
    }

    let frame = null;

    const resizeEditor = () => {
        if (frame) {
            cancelAnimationFrame(frame);
        }

        frame = requestAnimationFrame(() => {
            editor.layout();
        });
    };

    const observer = new ResizeObserver(() => {
        resizeEditor();
    });

    observer.observe(container);

    window.addEventListener("resize", resizeEditor);

    resizeEditor();

    return () => {
        observer.disconnect();
        window.removeEventListener("resize", resizeEditor);

        if (frame) {
            cancelAnimationFrame(frame);
        }
    };
}, [editorRef]);

    return (
        <div className="workspace-editor-main">
            <div className="workspace-editor-tab">
                <div className="workspace-tabs-list">
                    {openTabs.map((tab) => {
                        const isActive = selectedFile?._id === tab._id;
                        return (
                            <div
                                key={tab._id}
                                ref={(element) => {
                                    if (isActive && element) {
                                        element.scrollIntoView({
                                            behavior: "smooth",
                                            block: "nearest",
                                            inline: "nearest"
                                        });
                                    }
                                }}
                                className={`workspace-file-tab ${
                                    isActive
                                        ? "workspace-file-tab--active"
                                        : ""
                                }`}
                                onClick={() => switchToTab(tab)}
                                title={tab.path}
                            >
                                <span className="workspace-file-tab-dot" />
                                <span className="workspace-file-tab-name">
                                    {tab.path.split(/[\\/]/).pop()}
                                </span>
                                {dirtyTabs[tab._id] ? (
                                    <span
                                        className="workspace-file-tab-dirty"
                                        title="Unsaved changes"
                                    >
                                        ●
                                    </span>
                                ) : (
                                    <span className="workspace-file-tab-dirty-placeholder" />
                                )}
                                <button
                                    type="button"
                                    className="workspace-file-tab-close"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        closeTab(tab);
                                    }}
                                    title={`Close ${tab.path}`}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="workspace-editor-actions">
                    <button
                        type="button"
                        className="workspace-editor-action"
                        onClick={undoEditor}
                        disabled={!selectedFile}
                        title="Undo"
                    >
                        ↶
                        <span>Undo</span>
                    </button>
                    <button
                        type="button"
                        className="workspace-editor-action"
                        onClick={redoEditor}
                        disabled={!selectedFile}
                        title="Redo"
                    >
                        ↷
                        <span>Redo</span>
                    </button>
                    <button
                        type="button"
                        className={`workspace-editor-action ${
                            getProblems().length > 0
                                ? "workspace-editor-action--problems"
                                : ""
                        }`}
                        onClick={() => {
                            setShowProblems((previous) => {
                                const next = !previous;
                                if (next) {
                                    setShowTerminal(false);
                                }
                                return next;
                            });
                        }}
                        title="Problems"
                    >
                        ⚠
                        <span>
                            Problems {getProblems().length}
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`workspace-editor-action ${
                            showTerminal
                                ? "workspace-editor-action--terminal-active"
                                : ""
                        }`}
                        onClick={() => {
                            setShowTerminal((previous) => {
                                const next = !previous;
                                if (next) {
                                    setShowProblems(false);
                                }
                                return next;
                            });
                        }}
                        title="Integrated Terminal (Ctrl+`)"
                    >
                        &gt;_
                        <span>Terminal</span>
                    </button>
                </div>
            </div>
            <div
                className="workspace-editor-area"
                ref={editorContainerRef}
            >
                <Editor
                    height="100%"
                    onMount={(editor) => {
                        editorRef.current = editor;
                        editor.onDidChangeCursorSelection((event) => {
                            const selection = event.selection;
                            if (selection.isEmpty()) {
                                setSelectedCode("");
                                selectionRef.current = null;
                                return;
                            }
                            selectionRef.current = {
                                startLineNumber: selection.startLineNumber,
                                startColumn: selection.startColumn,
                                endLineNumber: selection.endLineNumber,
                                endColumn: selection.endColumn
                            };

                            const selectedText =
                                editor
                                    .getModel()
                                    .getValueInRange(selection);

                            setSelectedCode(selectedText);
                        });

                        const container = editorContainerRef.current;

                        if (!container) {
                            return;
                        }

                        let frame = null;

                        const layoutEditor = () => {
                            if (frame) {
                                cancelAnimationFrame(frame);
                            }

                            frame = requestAnimationFrame(() => {
                                editor.layout();
                            });
                        };

                        const resizeObserver = new ResizeObserver(() => {
                            layoutEditor();
                        });

                        resizeObserver.observe(container);

                        window.addEventListener("resize", layoutEditor);

                        layoutEditor();

                        editor.onDidDispose(() => {
                            resizeObserver.disconnect();
                            window.removeEventListener("resize", layoutEditor);

                            if (frame) {
                                cancelAnimationFrame(frame);
                            }
                        });
                    }}
                    onChange={(value) => {
                        const nextContent = value ?? "";
                        setFileContent(nextContent);
                        setIsDirty(true);
                        setSaveMessage("");
                        if (selectedFile?._id) {
                            setTabContents((previous) => ({
                                ...previous,
                                [selectedFile._id]: nextContent
                            }));
                            setDirtyTabs((previous) => ({
                                ...previous,
                                [selectedFile._id]: true
                            }));
                        }
                    }}
                    language={selectedFile ? getLanguage(selectedFile.extension) : "plaintext"}
                    value={fileContent}
                    theme="vs-dark"
                    options={{
                        readOnly: false,
                        minimap: {enabled: true},
                        fontSize: 14,
                        automaticLayout: false,
                        padding: {top: 12},
                        scrollBeyondLastLine: false
                    }}
                    onValidate={(markers) => {
                        setEditorProblems(markers);
                    }}
                />
            </div>
        </div>
    );
};

export default WorkspaceEditor;