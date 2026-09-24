import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Workspace.css";
import WorkspaceModals from "./components/WorkspaceModals/WorkspaceModals";
import WorkspaceCommandPalette from "./components/WorkspaceCommandPalette/WorkspaceCommandPalette";
import WorkspaceAIResults from "./components/WorkspaceAI/WorkspaceAIResults";
import WorkspaceAIInput from "./components/WorkspaceAI/WorkspaceAIInput";
import WorkspaceAIChat from "./components/WorkspaceAI/WorkspaceAIChat";
import WorkspaceSourceControl from "./components/WorkspaceSourceControl/WorkspaceSourceControl";
import WorkspaceAIHeader from "./components/WorkspaceAI/WorkspaceAIHeader";
import WorkspaceTerminal from "./components/WorkspaceTerminal/WorkspaceTerminal";
import WorkspaceProblems from "./components/WorkspaceProblems/WorkspaceProblems";
import WorkspaceEditor from "./components/WorkspaceEditor/WorkspaceEditor";
import WorkspaceHeader from "./components/WorkspaceHeader/WorkspaceHeader";
import WorkspaceExplorer from "./components/WorkspaceExplorer/WorkspaceExplorer";
import API from "../../api/api";
import { useToast } from "../../components/Toast/ToastContext";

const Workspace = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const toast = useToast() 
    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [openTabs, setOpenTabs] = useState([]);
    const [tabContents, setTabContents] = useState({});
    const [dirtyTabs, setDirtyTabs] = useState({});
    const [fileContent, setFileContent] = useState("");
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loading, setLoading] = useState(true);
    const [asking, setAsking] = useState(false);
    const [error, setError] = useState("");
    const [editorProblems, setEditorProblems] = useState([]);
    const [selectedCode, setSelectedCode] = useState("");
    const [fixResult, setFixResult] = useState(null);
    const [showFix, setShowFix] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [generationResult, setGenerationResult] = useState(null);
    const [showGeneration, setShowGeneration] = useState(false);
    const [generationOriginal, setGenerationOriginal] = useState("");
    const [generatingCode, setGeneratingCode] = useState(false);
    const [applyingGeneration, setApplyingGeneration] = useState(false);
    const [testGenerationResult, setTestGenerationResult] = useState(null);
    const [showTestGeneration, setShowTestGeneration] = useState(false);
    const [generatingTests, setGeneratingTests] = useState(false);
    const [applyingTests, setApplyingTests] = useState(false);
    const [multiFileResult, setMultiFileResult] = useState(null);
    const [showMultiFileGeneration, setShowMultiFileGeneration] = useState(false);
    const [multiFileIndex, setMultiFileIndex] = useState(0);
    const [multiFileReview, setMultiFileReview] = useState({});
    const [multiFileOriginalContents, setMultiFileOriginalContents] = useState({});
    const [generatingMultiFile, setGeneratingMultiFile] = useState(false);
    const [applyingMultiFile, setApplyingMultiFile] = useState(false);
    const generationRangeRef = useRef(null);
    const [showAI, setShowAI] = useState(() => {
        const saved = localStorage.getItem("ai-devos-show-ai");
        return saved === null
            ? false
            : saved === "true";
    });
    const aiInputRef = useRef(null);
    const [applyingFix, setApplyingFix] = useState(false);
    const [reviewResult, setReviewResult] = useState(null);
    const [reviewing, setReviewing] = useState(false);
    const selectionRef = useRef(null);
    const editorRef = useRef(null);
    const decorationRef = useRef([]);
    const [buildDiagnosis, setBuildDiagnosis] = useState(null);
    const [diagnosingBuild, setDiagnosingBuild] = useState(false);
    const [buildResult, setBuildResult] = useState(null);
    const [runningBuild, setRunningBuild] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [runningTests, setRunningTests] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [savingFile, setSavingFile] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [pendingFile, setPendingFile] = useState(null);
    const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
    const [switchingFile, setSwitchingFile] = useState(false);
    const [gitStatus, setGitStatus] = useState(null);
    const [gitDiff, setGitDiff] = useState("");
    const [selectedGitFile, setSelectedGitFile] = useState(null);
    const [loadingGit, setLoadingGit] = useState(false);
    const [gitActionLoading, setGitActionLoading] = useState(false);
    const [commitMessage, setCommitMessage] = useState("");
    const [gitBranches, setGitBranches] = useState([]);
    const [gitHistory, setGitHistory] = useState([]);
    const [agentInstruction, setAgentInstruction] = useState("");
    const [showGitBranches, setShowGitBranches] = useState(false);
    const [showGitHistory, setShowGitHistory] = useState(false);
    const [newBranchName, setNewBranchName] = useState("");
    const [loadingGitBranches, setLoadingGitBranches] = useState(false);
    const [loadingGitHistory, setLoadingGitHistory] = useState(false);
    const [agentPlan, setAgentPlan] = useState(null);
    const [showAgentPlan, setShowAgentPlan] = useState(false);
    const [planningAgent, setPlanningAgent] = useState(false);
    const [showSourceControl, setShowSourceControl] = useState(false);
    const [showProblems, setShowProblems] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [explorerWidth, setExplorerWidth] = useState(() => {
        const saved = Number(localStorage.getItem("ai-devos-explorer-width"));
        if (!Number.isFinite(saved)) {
            return 260;
        }
        return Math.min(480, Math.max(180, saved));
    });
    const [aiWidth, setAiWidth] = useState(() => {
        const saved = Number(localStorage.getItem("ai-devos-ai-width"));
        if (!Number.isFinite(saved)) {
            return 360;
        }
        return Math.min(600, Math.max(280, saved));
    });
    const [aiButtonPosition, setAiButtonPosition] = useState(() => {
        const saved = localStorage.getItem("ai-devos-ai-button-position");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // Use default position.
            }
        }
        return {
            x: null,
            y: null
        };
    });
    const syncWorkspaceRef = useRef(null);
    useEffect(() => {
        if (aiButtonPosition.x === null || aiButtonPosition.y === null) {
            return;
        }
        localStorage.setItem("ai-devos-ai-button-position", JSON.stringify(aiButtonPosition));
    }, [aiButtonPosition]);
    const aiButtonDraggingRef = useRef(false);
    const aiButtonDragOffsetRef = useRef({x: 0, y: 0});
    const resizingRef = useRef(null);
    const [terminalInput, setTerminalInput] = useState("");
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [runningTerminal, setRunningTerminal] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [commandPaletteQuery, setCommandPaletteQuery] = useState("");
    const [creatingFile, setCreatingFile] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingFiles, setSearchingFiles] = useState(false);
    const fixRangeRef = useRef(null);
    const programmaticSelectionRef = useRef(false);
    const restoredFileRef = useRef(false);
    const restoredTabsRef = useRef(false);
    const [executingAgent, setExecutingAgent] = useState(false);
    const [agentExecutionResult, setAgentExecutionResult] = useState(null);
    const [editingMessageIndex, setEditingMessageIndex] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);

    const startResize = useCallback((panel, event) => {
        resizingRef.current = {
            panel,
            startX: event.clientX,
            startWidth: panel === "explorer" ? explorerWidth : aiWidth
        };
        const handleMouseMove = (event) => {
            const resizeState = resizingRef.current;
            if (!resizeState) {
                return;
            }
            const delta = event.clientX - resizeState.startX;
            if (resizeState.panel === "explorer") {
                const nextWidth = Math.min(480, Math.max(180, resizeState.startWidth + delta));
                setExplorerWidth(nextWidth);
            }
            if (resizeState.panel === "ai") {
                const nextWidth = Math.min(600, Math.max(280, resizeState.startWidth - delta));
                setAiWidth(nextWidth);
            }
        };

        const handleMouseUp = () => {
            resizingRef.current = null;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, [explorerWidth, aiWidth]);

    const startAIButtonDrag = (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        let hasMoved = false;
        let finalPosition = {
            x: aiButtonPosition.x === null ? rect.left : aiButtonPosition.x,
            y: aiButtonPosition.y === null ? rect.top : aiButtonPosition.y
        };
        aiButtonDraggingRef.current = true;
        aiButtonDragOffsetRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        const handleMouseMove = (moveEvent) => {
            if (!aiButtonDraggingRef.current) {
                return;
            }
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
                hasMoved = true;
            }
            if (!hasMoved) {
                return;
            }
            const buttonWidth = rect.width;
            const buttonHeight = rect.height;
            const maxX = window.innerWidth - buttonWidth;
            const maxY = window.innerHeight - buttonHeight;
            finalPosition = {
                x: Math.min(Math.max(moveEvent.clientX - aiButtonDragOffsetRef.current.x, 0), maxX),
                y: Math.min(Math.max(moveEvent.clientY - aiButtonDragOffsetRef.current.y, 0), maxY)
            };
            setAiButtonPosition(finalPosition);
        };

        const handleMouseUp = () => {
            aiButtonDraggingRef.current = false;
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            if (hasMoved) {
                localStorage.setItem("ai-devos-ai-button-position", JSON.stringify(finalPosition));
            }
        };
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const selectFile = useCallback(async (file, bypassDirtyCheck = false) => {
        if (file.type !== "file") {
            return;
        }
        if (selectedFile?._id === file._id) {
            return;
        }
        if (isDirty && !bypassDirtyCheck) {
            setPendingFile(file);
            setShowSwitchConfirm(true);
            return;
        }
        try {
            let content;
            if (
                Object.prototype.hasOwnProperty.call(tabContents, file._id)
            ) {
                content = tabContents[file._id];
            } else {
                const response = await API.get(`/projects/${projectId}/files/${file._id}/content`);
                content = response.data.content;
                setTabContents((previous) => ({
                    ...previous,
                    [file._id]: content
                }));
            }
            setOpenTabs((previousTabs) => {
                const alreadyOpen = previousTabs.some((tab) => tab._id === file._id);
                if (alreadyOpen) {
                    return previousTabs;
                }
                return [...previousTabs, file];
            });
            setSelectedFile(file);
            localStorage.setItem(`ai-devos-last-file-${projectId}`, file._id);
            setFileContent(content);
            setIsDirty(Boolean(dirtyTabs[file._id]));
            selectionRef.current = null;
            fixRangeRef.current = null;
            setSelectedCode("");
            setShowFix(false);
            setShowDiff(false);
            setSaveMessage("");
            setShowGeneration(false);
            setGenerationResult(null);
            setGenerationOriginal("");
            generationRangeRef.current = null;
            if (editorRef.current) {
                decorationRef.current =  editorRef.current.deltaDecorations(decorationRef.current,[]);
            }
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.error || "Failed to load file");
        }
    },[dirtyTabs,isDirty,projectId,selectedFile,tabContents])

    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const projectResponse = await API.get(`/projects/${projectId}`);
                const filesResponse = await API.get(`/projects/${projectId}/files`);
                setProject(projectResponse.data.project);
                setFiles(filesResponse.data.files);
            } catch (error) {
                console.error(error);
                setError(error.response?.data?.error || "Failed to load workspace");
            } finally {
                setLoading(false);
            }
        };
        loadWorkspace();
    }, [projectId]);

    useEffect(() => {
        if (loading || files.length === 0 || restoredTabsRef.current) {
            return;
        }
        restoredTabsRef.current = true;
        const savedTabs = localStorage.getItem(`ai-devos-open-tabs-${projectId}`);
        const savedActiveTab = localStorage.getItem(`ai-devos-last-file-${projectId}`);
        if (!savedTabs) {
            if (savedActiveTab) {
                const lastFile = files.find((file) => file._id === savedActiveTab);
                if (lastFile) {
                    selectFile(lastFile, true);
                } else {
                    localStorage.removeItem(`ai-devos-last-file-${projectId}`);
                }
            }
            return;
        }

        try {
            const parsedTabs = JSON.parse(savedTabs);
            if (!Array.isArray(parsedTabs)) {
                throw new Error("Invalid saved tabs");
            }
            const validTabs = parsedTabs.map((savedTab) => files.find((file) => file._id === savedTab._id)).filter(Boolean);
            setOpenTabs(validTabs);
            if (savedActiveTab) {
                const activeTab = validTabs.find((file) => file._id === savedActiveTab);
                if (activeTab) {
                    selectFile(activeTab, true);
                    return;
                }
            }

            if (validTabs.length > 0) {
                selectFile(validTabs[0], true);
            }
        } catch (error) {
            console.error("Failed to restore editor tabs:", error);
            localStorage.removeItem(`ai-devos-open-tabs-${projectId}`);
            if (savedActiveTab) {
                const lastFile = files.find((file) => file._id === savedActiveTab);
                if (lastFile) {
                    selectFile(lastFile, true);
                }
            }
        }
    }, [loading, files, projectId,selectFile]);

    useEffect(() => {
        if (loading) {
            return;
        }
        localStorage.setItem(`ai-devos-open-tabs-${projectId}`, JSON.stringify(openTabs.map((tab) => ({_id: tab._id}))));
        if (selectedFile?._id) {
            localStorage.setItem(`ai-devos-last-file-${projectId}`, selectedFile._id);
        } else {
            localStorage.removeItem(`ai-devos-last-file-${projectId}`);
        }
    }, [openTabs,selectedFile,projectId,loading]);

    const syncWorkspaceFromServer = useCallback(
        async (changedPaths = []) => {
            try {
                const response = await API.get(
                    `/projects/${projectId}/files`
                );

                const latestFiles =
                    response.data.files || [];

                setFiles(latestFiles);

                const normalizedChangedPaths =
                    new Set(
                        changedPaths
                            .map((filePath) =>
                                String(filePath || "")
                                    .replace(/\\/g, "/")
                                    .replace(/^\/+/, "")
                                    .trim()
                            )
                            .filter(Boolean)
                    );

                const tabsToSync = openTabs.filter(
                    (tab) => {
                        const normalizedTabPath =
                            String(tab.path || "")
                                .replace(/\\/g, "/")
                                .replace(/^\/+/, "")
                                .trim();

                        return (
                            normalizedChangedPaths.size ===
                                0 ||
                            normalizedChangedPaths.has(
                                normalizedTabPath
                            )
                        );
                    }
                );

                await Promise.all(
                    tabsToSync.map(async (tab) => {
                        // Never overwrite unsaved user work.
                        if (dirtyTabs[tab._id]) {
                            return;
                        }

                        const latestFile =
                            latestFiles.find(
                                (file) =>
                                    file._id === tab._id ||
                                    String(file.path || "")
                                        .replace(/\\/g, "/") ===
                                        String(tab.path || "")
                                            .replace(/\\/g, "/")
                            );

                        if (!latestFile) {
                            return;
                        }

                        const contentResponse =
                            await API.get(
                                `/projects/${projectId}/files/${latestFile._id}/content`
                            );

                        const latestContent =
                            contentResponse.data.content ?? "";

                        setTabContents(
                            (previous) => ({
                                ...previous,
                                [latestFile._id]:
                                    latestContent
                            })
                        );

                        if (
                            selectedFile?._id ===
                            latestFile._id
                        ) {
                            setFileContent(
                                latestContent
                            );
                            setIsDirty(false);
                        }
                    })
                );

                const deletedPaths = [...normalizedChangedPaths].filter(
                    (changedPath) =>
                        !latestFiles.some(
                            (file) =>
                                String(file.path || "")
                                    .replace(/\\/g, "/")
                                    .replace(/^\/+/, "")
                                    .trim() === changedPath
                        )
                );

                if (deletedPaths.length > 0) {
                    const deletedTabs = openTabs.filter((tab) => {
                        const tabPath = String(tab.path || "")
                            .replace(/\\/g, "/")
                            .replace(/^\/+/, "")
                            .trim();

                        return deletedPaths.includes(tabPath);
                    });

                    const deletedTabIds = deletedTabs.map(
                        (tab) => tab._id
                    );

                    setOpenTabs((previousTabs) =>
                        previousTabs.filter(
                            (tab) => !deletedTabIds.includes(tab._id)
                        )
                    );

                    setTabContents((previous) => {
                        const updated = { ...previous };

                        deletedTabIds.forEach((fileId) => {
                            delete updated[fileId];
                        });

                        return updated;
                    });

                    setDirtyTabs((previous) => {
                        const updated = { ...previous };

                        deletedTabIds.forEach((fileId) => {
                            delete updated[fileId];
                        });

                        return updated;
                    });

                    const selectedPath = String(selectedFile?.path || "")
                        .replace(/\\/g, "/")
                        .replace(/^\/+/, "")
                        .trim();

                    if (selectedPath && deletedPaths.includes(selectedPath)) {
                        setSelectedFile(null);
                        setFileContent("");
                        setSelectedCode("");
                        setIsDirty(false);

                        localStorage.removeItem(
                            `ai-devos-last-file-${projectId}`
                        );
                    }
                } else {
                    setOpenTabs((previousTabs) =>
                        previousTabs.map((tab) => {
                            const latestFile =
                                latestFiles.find(
                                    (file) => file._id === tab._id
                                );

                            return latestFile || tab;
                        })
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to sync workspace:",
                    error
                );

                setError(
                    error.response?.data?.error ||
                        "Failed to sync workspace"
                );

                throw error;
            }
        },
        [
            projectId,
            openTabs,
            dirtyTabs,
            selectedFile
        ]
    );

    syncWorkspaceRef.current = syncWorkspaceFromServer;

    useEffect(() => {
        restoredFileRef.current = false;
        restoredTabsRef.current = false;
    }, [projectId]);

    useEffect(() => {
        if (loading || !projectId) {
            return;
        }

        const controller = new AbortController()

        const connectWorkspaceEvents = async () => {
            while (!controller.signal.aborted) {
                try {
                    const token = localStorage.getItem("token");

                    if (!token) {
                        return;
                    }

                    const response = await fetch(
                        `${API.defaults.baseURL}/projects/${projectId}/events`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                            signal: controller.signal
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Workspace event stream failed (${response.status})`
                        );
                    }

                    if (!response.body) {
                        throw new Error(
                            "Workspace event stream has no response body"
                        );
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";

                    while (!controller.signal.aborted) {
                        const { value, done } = await reader.read();

                        if (done) {
                            break;
                        }

                        buffer += decoder.decode(value, {
                            stream: true
                        });

                        const events = buffer.split("\n\n");
                        buffer = events.pop() || "";

                        for (const eventBlock of events) {
                            const dataLine = eventBlock
                                .split("\n")
                                .find((line) =>
                                    line.startsWith("data: ")
                                );

                            if (!dataLine) {
                                continue;
                            }

                            try {
                                const event = JSON.parse(
                                    dataLine.slice(6)
                                );

                                console.log(
                                    "WORKSPACE EVENT RECEIVED:",
                                    event
                                );

                                if (event.type === "workspace-change") {
                                    try {
                                        await syncWorkspaceRef.current?.(
                                            event.path
                                                ? [event.path]
                                                : []
                                        );
                                    } catch (syncError) {
                                        console.error(
                                            "Failed to sync workspace after external change:",
                                            syncError
                                        );
                                    }
                                }
                            } catch (parseError) {
                                console.error(
                                    "Failed to parse workspace event:",
                                    parseError
                                );
                            }
                        }
                    }
                } catch (error) {
                    if (error.name !== "AbortError") {
                        console.error(
                            "Workspace event stream error:",
                            error
                        );
                    }
                }

                if (controller.signal.aborted) {
                    break;
                }

                await new Promise((resolve) => {
                    setTimeout(resolve, 5000);
                });
            }
        };

        connectWorkspaceEvents();

        return () => {
            controller.abort();

            
        };
    }, [loading, projectId]);

    const switchToTab = useCallback(async (tab) => {
        await selectFile(tab);
    },[selectFile])

    const closeActiveTab = useCallback((tab) => {
        setOpenTabs((previousTabs) => {
            const currentIndex = previousTabs.findIndex((item) => item._id === tab._id);
            const remainingTabs = previousTabs.filter((item) => item._id !== tab._id);
            setTabContents((previous) => {
                const updated = { ...previous };
                delete updated[tab._id];
                return updated;
            });
            setDirtyTabs((previous) => {
                const updated = { ...previous };
                delete updated[tab._id];
                return updated;
            });
            if (remainingTabs.length === 0) {
                setSelectedFile(null);
                setFileContent("");
                setSelectedCode("");
                setIsDirty(false);
                localStorage.removeItem(`ai-devos-last-file-${projectId}`);
                localStorage.removeItem(`ai-devos-open-tabs-${projectId}`);
                return [];
            }
            const nextIndex = Math.min(currentIndex, remainingTabs.length - 1);
            const nextTab = remainingTabs[nextIndex];
            setTimeout(() => {
                selectFile(nextTab, true);
            }, 0);
            return remainingTabs;
        });
    },[projectId,selectFile])

    const closeTab = useCallback(async (tab) => {
        if (!tab?._id) {
            return;
        }
        if (selectedFile?._id !== tab._id) {
            setOpenTabs((previousTabs) => previousTabs.filter((item) => item._id !== tab._id));
            return;
        }
        if (isDirty) {
            setPendingFile({
                ...tab,
                __closeAfterSave: true
            });
            setShowSwitchConfirm(true);
            return;
        }
        closeActiveTab(tab);
    },[closeActiveTab, isDirty,selectedFile])

    useEffect(() => {
        const handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            if (event.ctrlKey && key === "s") {
                event.preventDefault();
                if (!selectedFile?._id) {
                    return;
                }
                if (!isDirty) {
                    setSaveMessage("No changes to save");
                    setTimeout(() => {
                        setSaveMessage("");
                    }, 2000);
                    return;
                }
                setShowSaveConfirm(true);
                return;
            }
            if (event.ctrlKey && !event.shiftKey && key === "z") {
                event.preventDefault();
                undoEditor();
                return;
            }
            if (event.ctrlKey && key === "y") {
                event.preventDefault();
                redoEditor();
                return;
            }
            if (event.ctrlKey && event.shiftKey && key === "f") {
                event.preventDefault();
                setShowSearch(true);
                return;
            }
            if (event.ctrlKey && !event.shiftKey && key === "w") {
                event.preventDefault();
                if (!selectedFile?._id) {
                    return;
                }
                closeTab(selectedFile);
                return;
            }
            if (event.ctrlKey &&  event.key === "`") {
                event.preventDefault();
                setShowTerminal((previous) => {
                    const next = !previous;
                    if (next) {
                        setShowProblems(false);
                    }
                    return next;
                });
                return;
            }
            if (event.ctrlKey && event.shiftKey && key === "p") {
                event.preventDefault();
                setShowCommandPalette(true);
                setCommandPaletteQuery("");
                return;
            }
            if (event.ctrlKey && !event.shiftKey && key === "tab") {
                event.preventDefault();
                if (openTabs.length <= 1 || !selectedFile) {
                    return;
                }
                const currentIndex = openTabs.findIndex((tab) => tab._id === selectedFile._id);
                if (currentIndex === -1) {
                    return;
                }
                const nextIndex = (currentIndex + 1) % openTabs.length;
                switchToTab(openTabs[nextIndex]);
                return;
            }
            if (event.ctrlKey && event.shiftKey && key === "tab") {
                event.preventDefault();
                if (openTabs.length <= 1 || !selectedFile) {
                    return;
                }
                const currentIndex = openTabs.findIndex((tab) => tab._id === selectedFile._id);
                if (currentIndex === -1) {
                    return;
                }
                const previousIndex = (currentIndex - 1 + openTabs.length) %
                openTabs.length;
                switchToTab(openTabs[previousIndex]);
                return;
            }
            if (event.ctrlKey && /^[1-9]$/.test(event.key)) {
                event.preventDefault();
                const tabIndex =  Number(event.key) - 1;
                if (tabIndex >= openTabs.length) {
                    return;
                }
                switchToTab(openTabs[tabIndex]);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isDirty,selectedFile,openTabs,closeTab,switchToTab]);

    const requestFileSwitch = (file) => {
        selectFile(file);
    };

    const cancelFileSwitch = () => {
        setPendingFile(null);
        setShowSwitchConfirm(false);
    };

    const discardAndSwitchFile = async () => {
        if (!pendingFile) {
            return;
        }
        const fileToOpen = pendingFile;
        setSwitchingFile(true);
        setIsDirty(false);
        setSaveMessage("");
        setPendingFile(null);
        setShowSwitchConfirm(false);
        if (fileToOpen.__closeAfterSave) {
            setSwitchingFile(false);
            closeActiveTab(fileToOpen);
            return;
        }
        await selectFile(fileToOpen, true);
        setSwitchingFile(false);
    };

    const saveCurrentFile = async () => {
        if (!selectedFile?._id) {
            return false;
        }
        try {
            const editor = editorRef.current;
            if (!editor) {
                return false;
            }
            const content = editor.getValue();
            const response = await API.put(`/projects/${projectId}/files/${selectedFile._id}/content`, {
                content
            });
            const savedFile = response.data.file || response.data;
            setFileContent(content);
            setIsDirty(false);
            setTabContents((previous) => ({
                ...previous,
                [selectedFile._id]: content
            }));
            setDirtyTabs((previous) => {
                const updated = { ...previous };
                delete updated[selectedFile._id];
                return updated;
            });
            setSelectedFile((previous) => {
                if (!previous) {
                    return previous;
                }
                return {
                    ...previous,
                    ...savedFile
                };
            });
            setFiles((previousFiles) =>
                previousFiles.map((file) => file._id === selectedFile._id
                    ? {
                        ...file,
                        ...savedFile
                    }
                    : file
                )
            );
            setSaveMessage("Saved successfully");
            toast.success("File saved successfully");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
            console.log("File saved successfully");
            return true;
        } catch (error) {
            console.error("Failed to save file:", error);
            setError(error.response?.data?.error || "Failed to save file");
            toast.error(error.response?.data?.error || "Failed to save file");
            return false;
        }
    };

    const saveAndSwitchFile = async () => {
        if (!pendingFile) {
            return;
        }
        const fileToOpen = pendingFile;
        setSwitchingFile(true);
        const saved = await saveCurrentFile();
        if (!saved) {
            setSwitchingFile(false);
            return;
        }
        setPendingFile(null);
        setShowSwitchConfirm(false);
        if (fileToOpen.__closeAfterSave) {
            setSwitchingFile(false);
            closeActiveTab(fileToOpen);
            return;
        }
        await selectFile(fileToOpen, true);
        setSwitchingFile(false);
    };

    const openSource = async (source) => {
        const normalizedPath = source.filePath?.replace(/\\/g, "/");
        const file = files.find((file) => file.path.replace(/\\/g, "/") === normalizedPath);
        if (!file) {
            setError(`File not found: ${source.filePath}`);
            return;
        }
        await selectFile(file, true);
        setTimeout(() => {
            if (!editorRef.current) {
                return;
            }
            const editor = editorRef.current;
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const lineCount = model.getLineCount();
            const startLine = Math.min(Math.max(Number(source.startLine) || 1,1), lineCount);
            const endLine = Math.min(Math.max(Number(source.endLine ?? source.startLine) || startLine, startLine), lineCount);
            const range = {
                startLineNumber: startLine,
                startColumn: 1,
                endLineNumber: endLine,
                endColumn: model.getLineMaxColumn(endLine)
            };
            programmaticSelectionRef.current = true;
            fixRangeRef.current = range;
            decorationRef.current = editor.deltaDecorations(decorationRef.current, []);
            decorationRef.current = editor.deltaDecorations([], [
                {
                    range: {
                        startLineNumber: startLine,
                        startColumn: 1,
                        endLineNumber: endLine,
                        endColumn: 1
                    },
                    options: {
                        isWholeLine: true,
                        className: "source-code-highlight"
                    }
                }
            ]);
            editor.setSelection(range);
            const selectedText = model.getValueInRange(range);
            setSelectedCode(selectedText);
            editor.revealLineInCenter(startLine);
            editor.focus();
        }, 100);
    };

    const getLanguage = (extension) => {
        const languages = {
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".json": "json",
            ".html": "html",
            ".css": "css",
            ".scss": "scss",
            ".py": "python",
            ".java": "java",
            ".c": "c",
            ".cpp": "cpp",
            ".h": "c",
            ".hpp": "cpp",
            ".go": "go",
            ".rs": "rust",
            ".php": "php",
            ".rb": "ruby",
            ".cs": "csharp",
            ".sql": "sql",
            ".md": "markdown",
            ".yml": "yaml",
            ".yaml": "yaml"
        };
        return (languages[extension] || "plaintext");
    };

    const searchProjectFiles = useCallback(async (query) => {
        const cleanQuery = query.trim();
        if (!cleanQuery) {
            setSearchResults([]);
            return;
        }
        try {
            setSearchingFiles(true);
            setError("");
            const results = [];
            const lowerQuery = cleanQuery.toLowerCase();
            const fileResults = await Promise.all(files.filter((file) => file.type === "file").map(async (file) => {
                try {
                    const response = await API.get(`/projects/${projectId}/files/${file._id}/content`);
                    const content = response.data.content || "";
                    const lines = content.split("\n");
                    const matches = [];
                    lines.forEach((line, index) => {
                        if (line.toLowerCase().includes(lowerQuery)) {
                            matches.push({
                                file,
                                lineNumber: index + 1,
                                line: line.trim()
                            });
                        }
                    });
                    return matches;
                } catch (error) {
                    console.error(`Failed to search ${file.path}:`, error);
                    return [];
                }
            }));
            fileResults.forEach((matches) => {
                results.push(...matches);
            });
            setSearchResults(results);
        } catch (error) {
            console.error("Project search failed:", error);
            setError("Failed to search project");
        } finally {
            setSearchingFiles(false);
        }
    },[files,projectId])

    const openSearchResult = async (result) => {
        await selectFile(result.file, true);
        setTimeout(() => {
            if (!editorRef.current) {
                return;
            }
            const editor = editorRef.current;
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const lineNumber = Math.min(Math.max(result.lineNumber, 1), model.getLineCount());
            editor.revealLineInCenter(lineNumber);
            editor.setPosition({
                lineNumber,
                column: 1
            });
            editor.focus();
        }, 150);
    };

    useEffect(() => {
        if (!showSearch) {
            return;
        }
        const timeout = setTimeout(() => {
            searchProjectFiles(searchQuery);
        }, 300);
        return () => {
            clearTimeout(timeout);
        };
    }, [searchQuery,showSearch,files,searchProjectFiles]);

    const askAI = async (
        e,
        retryQuestion = null,
        retryIndex = null,
        retryMessageId = null
    ) => {
        if (e) {
            e.preventDefault();
        }
        const currentQuestion = retryQuestion?.trim() || question.trim();
        if (!currentQuestion || asking) {
            return;
        }
        const isEditing = editingMessageIndex !== null;
        const isRetrying = retryIndex !== null;
        if (isEditing) {
            setMessages((previous) =>
                previous.slice(0, editingMessageIndex)
            );
        }
        setMessages((previous) => [
            ...previous,
            {
                role: "user",
                content: currentQuestion,
                filePath: selectedFile?.path || null,
                selectedCode: selectedCode || ""
            }
        ]);

        if (activeConversationId) {
            if (
                (isEditing && editingMessageId) ||
                (isRetrying && retryMessageId)
            ) {
                await API.put(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages/${
                        isRetrying ? retryMessageId : editingMessageId
                    }`,
                    {
                        content: currentQuestion,
                        filePath: selectedFile?.path || null,
                        selectedCode: selectedCode || ""
                    }
                );
            } else {
                const savedUserMessage = await API.post(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages`,
                    {
                        role: "user",
                        content: currentQuestion,
                        filePath: selectedFile?.path || null,
                        selectedCode: selectedCode || ""
                    }
                );

                const savedMessageId = savedUserMessage.data.message?._id;
                if (savedMessageId) {
                    setMessages((previous) => {
                        const updated = [...previous];
                        const lastIndex = updated.length - 1;

                        if (updated[lastIndex]?.role === "user") {
                            updated[lastIndex] = {
                                ...updated[lastIndex],
                                _id: savedMessageId
                            };
                        }

                        return updated;
                    });
                }

                const savedConversation = savedUserMessage.data.conversation;
                if (savedConversation) {
                    setConversations((previous) =>
                        previous.map((conversation) =>
                            conversation._id === activeConversationId
                                ? {
                                    ...conversation,
                                    title: savedConversation.title,
                                    updatedAt: savedConversation.updatedAt
                                }
                                : conversation
                        )
                    );
                }
            }
        }
        if (isRetrying) {
            setMessages((previous) => {
                const updated = [...previous];

                updated.splice(
                    retryIndex,
                    1,
                    {
                        ...updated[retryIndex],
                        role: "assistant",
                        content: "",
                        sources: []
                    }
                );

                return updated;
            });
        } else {
            setMessages((previous) => [
                ...previous,
                {
                    _id: null,
                    role: "assistant",
                    content: "",
                    sources: []
                }
            ]);
        }
        setQuestion("");
        setEditingMessageIndex(null);
        setEditingMessageId(null);
        setAsking(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API.defaults.baseURL}/projects/${projectId}/ask/stream`, { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        question: currentQuestion,
                        filePath: selectedFile?.path || null,
                        selectedCode: selectedCode || "",
                        currentFileContent: fileContent || "",
                        conversationId: activeConversationId
                    })
                }
            );
            if (!response.ok) {
                let message = "Failed to get AI response";
                try {
                    const errorData = await response.json();
                    message = errorData.error || message;
                } catch {
                    // Ignore JSON parsing failure.
                }
                throw new Error(message);
            }
            if (!response.body) {
                throw new Error("Streaming is not supported by this browser.");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let assistantContent = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                buffer += decoder.decode(value, {
                    stream: true
                });

                const events = buffer.split("\n\n");
                buffer = events.pop() || "";
                for (const event of events) {
                    const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
                    if (!dataLine) {
                        continue;
                    }
                    const data = dataLine.slice(5).trim();
                    if (!data) {
                        continue;
                    }
                    const payload = JSON.parse(data);
                    if (payload.type === "sources") {
                        const incomingSources = payload.sources || [];
                        setMessages((previous) => {
                            const updated = [...previous];
                            const lastIndex = updated.length - 1;
                            if (updated[lastIndex]?.role === "assistant") {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    sources: incomingSources
                                };
                            }
                            return updated;
                        });
                    }

                    if (payload.type === "token") {
                        assistantContent += payload.content || "";
                        const content = assistantContent;
                        setMessages((previous) => {
                                const updated = [...previous];
                                const lastIndex = updated.length - 1;
                                if (updated[lastIndex]?.role === "assistant") {
                                    updated[lastIndex] = {
                                        ...updated[lastIndex],
                                        content
                                    };
                                }
                                return updated;
                            }
                        );
                    }

                    if (payload.type === "error") {
                        throw new Error(payload.error || "AI streaming failed");
                    }
                    if (payload.type === "done") {
                        break;
                    }
                }
            }
            if (activeConversationId && assistantContent.trim()) {
                await API.post(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages`,
                    {
                        role: "assistant",
                        content: assistantContent,
                        filePath: selectedFile?.path || null
                    }
                );

                setConversations((previous) => {
                    const activeConversation = previous.find(
                        (conversation) =>
                            conversation._id === activeConversationId
                    );

                    if (!activeConversation) {
                        return previous;
                    }

                    const updatedConversation = {
                        ...activeConversation,
                        updatedAt: new Date().toISOString()
                    };

                    return [
                        updatedConversation,
                        ...previous.filter(
                            (conversation) =>
                                conversation._id !== activeConversationId
                        )
                    ];
                });
            }

            toast.success("AI response received");
        } catch (error) {
            console.error("AI streaming error:", error);
            toast.error(error.response?.data?.error || "Failed to get AI response");
            setMessages((previous) => {
                    const updated = [...previous];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex]?.role === "assistant") {
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: error.message || "Failed to get AI response"
                        };
                    }
                    return updated;
                }
            );
        } finally {
            setAsking(false);
        }
    };

    const explainSelectedCode = async () => {
        if (!selectedCode.trim()) {
            return;
        }

        setAsking(true);

        try {
            let savedUserMessage = null;

            if (activeConversationId) {
                const userResponse = await API.post(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages`,
                    {
                        role: "user",
                        content: "Explain the selected code.",
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                );

                savedUserMessage = userResponse.data.message || null;
            }

            setMessages((previous) => [
                ...previous,
                {
                    _id: savedUserMessage?._id || null,
                    role: "user",
                    content: "Explain the selected code.",
                    filePath: selectedFile?.path || null,
                    selectedCode
                }
            ]);

            const response = await API.post(
                `/projects/${projectId}/explain`,
                {
                    code: selectedCode,
                    filePath: selectedFile?.path,
                    conversationId: activeConversationId,
                    currentFileContent: fileContent || ""
                }
            );

            const assistantContent =
                response.data.answer || "Failed to explain code";

            if (activeConversationId && assistantContent.trim()) {
                const assistantResponse = await API.post(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages`,
                    {
                        role: "assistant",
                        content: assistantContent,
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                );

                setMessages((previous) => [
                    ...previous,
                    {
                        _id:
                            assistantResponse.data.message?._id ||
                            null,
                        role: "assistant",
                        content: assistantContent,
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                ]);
            } else {
                setMessages((previous) => [
                    ...previous,
                    {
                        role: "assistant",
                        content: assistantContent,
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                ]);
            }
        } catch (error) {
            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    content:
                        error.response?.data?.error ||
                        error.message ||
                        "Failed to explain code"
                }
            ]);
        } finally {
            setAsking(false);
        }
    };

    const fixSelectedCode = async () => {
        if (!selectedCode.trim()) {
            return;
        }
        setAsking(true);
        setShowFix(false);
        setShowDiff(false);
        setError("");
        try {
            if (activeConversationId) {
                await API.post(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages`,
                    {
                        role: "user",
                        content: "Fix the selected code.",
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                );
            }
            const response = await API.post(`/projects/${projectId}/fix`, {
                code: selectedCode,
                filePath: selectedFile?.path,
                conversationId: activeConversationId,
                currentFileContent: fileContent || ""
            });
            if (!response.data?.fixedCode) {
                throw new Error("AI did not return corrected code.");
            }
            setFixResult(response.data);
            setShowFix(true);
            setShowDiff(true);
            toast.success("AI fix generated");
            if (activeConversationId && response.data?.fixedCode) {
                const assistantResponse = await API.post(
                    `/projects/${projectId}/conversations/${activeConversationId}/messages`,
                    {
                        role: "assistant",
                        content: response.data.fixedCode,
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                );

                setMessages((previous) => [
                    ...previous,
                    {
                        _id:
                            assistantResponse.data.message?._id ||
                            null,
                        role: "assistant",
                        content: response.data.fixedCode,
                        filePath: selectedFile?.path || null,
                        selectedCode
                    }
                ]);
            }
        } catch (error) {
            console.error("Failed to fix code:", error);
            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    content: error.response?.data?.error || error.message || "Failed to fix code"
                }
            ]);
            const message = error.response?.data?.error || "Failed to fix code";
            toast.error(message);
        } finally {
            setAsking(false);
        }
    };

    const applyFix = async () => {
        if (!fixResult?.fixedCode) {
            return;
        }
        if (!editorRef.current) {
            return;
        }
        if (!selectedFile?._id) {
            return;
        }
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) {
            return;
        }
        const selection = fixRangeRef.current || selectionRef.current ||  editor.getSelection();
        if (!selection) {
            setError("No code selection available.");
            return;
        }
        try {
            setApplyingFix(true);
            model.pushEditOperations([], [
                {
                    range: selection,
                    text: fixResult.fixedCode
                }
            ],() => null);
            const updatedCode = model.getValue();
            await API.put(`/projects/${projectId}/files/${selectedFile._id}/content`,
                {
                    content: updatedCode
                }
            );
            setFileContent(updatedCode);
            setIsDirty(false);
            setTabContents((previous) => ({
                ...previous,
                [selectedFile._id]: updatedCode
            }));
            setDirtyTabs((previous) => {
                const updated = { ...previous };
                delete updated[selectedFile._id];
                return updated;
            });
            setSaveMessage("AI fix applied and saved");
            toast.success("AI fix applied and saved");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
            setSelectedCode("");
            setShowFix(false);
            setShowDiff(false);
            setFixResult(null);
            selectionRef.current = null;
            fixRangeRef.current = null;
        } catch (error) {
            console.error("Failed to apply AI fix:",error);
            setError(error.response?.data?.error || "Failed to apply AI fix");
            toast.error(error.response?.data?.error || "Failed to apply AI fix");
        } finally {
            setApplyingFix(false);
        }
    };

    const rejectFix = () => {
        setShowDiff(false);
        setShowFix(false);
        setFixResult(null);
        setSaveMessage("");
        selectionRef.current = null;
        fixRangeRef.current = null;
    };

    const reviewProject = async () => {
        setReviewing(true);
        setReviewResult(null);
        setError("");

        try {
            const response = await API.post(`/projects/${projectId}/review`);
            console.log("Project review:", response.data);
            setReviewResult(response.data.review);
            toast.success("Project review completed");
        } catch (error) {
            console.error("Project review failed:", error);
            const message = error.response?.data?.error || "Failed to review project";
            setError(message);
            toast.error(message);
        } finally {
            setReviewing(false);
        }
    };  

    const runBuild = async () => {
        setRunningBuild(true);
        setBuildResult(null);
        setError("");
        try {
            const saved = await saveCurrentFile();
            if (!saved) {
                return;
            }
            const response = await API.post(`/projects/${projectId}/check`,
                {
                    command: "build"
                }
            );
            setBuildResult(response.data.result);
            toast.success("Build completed");
        } catch (error) {
            console.error("Build failed to run:",error);
            setError(error.response?.data?.error || "Failed to run build");
            toast.error(error.response?.data?.error || "Failed to run build");
        } finally {
            setRunningBuild(false);
        }
    };

    const runTests = async () => {
        setRunningTests(true);
        setTestResult(null);
        setError("");
        try {
            const saved = await saveCurrentFile();
            if (!saved) {
                return;
            }
            const response = await API.post(`/projects/${projectId}/check`,
                {
                    command: "test"
                }
            );
            setTestResult(response.data.result);
            toast.success("Tests completed");
        } catch (error) {
            console.error("Tests failed to run:", error);
            setError(error.response?.data?.error || "Failed to run tests");
            toast.error(error.response?.data?.error || "Failed to run tests");
        } finally {
            setRunningTests(false);
        }
    };

    const diagnoseBuild = async () => {
        setDiagnosingBuild(true);
        setBuildDiagnosis(null);
        setError("");
        try {
            const saved = await saveCurrentFile();
            if (!saved) {
                return;
            }
            const response = await API.post(`/projects/${projectId}/diagnose`, { command: "test" });
            setBuildDiagnosis(response.data.diagnosis);
            toast.success("Test diagnosis completed");
        } catch (error) {
            console.error("Build diagnosis failed:", error);
            setError(error.response?.data?.error || "Failed to diagnose build");
            toast.error(error.response?.data?.error || "Failed to diagnose build");
        } finally {
            setDiagnosingBuild(false);
        }
    };

    const getProblems = () => {
        const problems = [];
        editorProblems.forEach((problem) => {
            problems.push({
                severity:
                    problem.severity === 8
                        ? "critical"
                        : problem.severity === 4
                            ? "warning"
                            : "info",
                label:
                    problem.severity === 8
                        ? "ERROR"
                        : problem.severity === 4
                            ? "WARNING"
                            : "INFO",
                file: selectedFile?.path || "",
                line: problem.startLineNumber,
                message: problem.message
            });
        });
        if (reviewResult) {
            reviewResult.critical?.forEach((issue) => {
                problems.push({
                    severity: "critical",
                    label: "ERROR",
                    file: issue.file,
                    line: issue.line,
                    message: issue.message
                });
            });

            reviewResult.warnings?.forEach((issue) => {
                problems.push({
                    severity: "warning",
                    label: "WARNING",
                    file: issue.file,
                    line: issue.line,
                    message: issue.message
                });
            });

            reviewResult.improvements?.forEach((issue) => {
                problems.push({
                    severity: "info",
                    label: "INFO",
                    file: issue.file,
                    line: issue.line,
                    message: issue.message
                });
            });
        }

        if (buildDiagnosis && buildDiagnosis.file && buildDiagnosis.message) {
            problems.push({
                severity: "critical",
                label: "BUILD",
                file: buildDiagnosis.file,
                line: buildDiagnosis.line,
                message: buildDiagnosis.message
            });
        }
        return problems;
    };

    const requestSave = () => {
        if (!selectedFile?._id) {
            return;
        }
        if (!isDirty) {
            setSaveMessage("No changes to save");
            setTimeout(() => {
                setSaveMessage("");
            }, 2000);
            return;
        }
        setShowSaveConfirm(true);
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const confirmSave = async () => {
        setSavingFile(true);
        const saved = await saveCurrentFile();
        setSavingFile(false);
        setShowSaveConfirm(false);
        if (!saved) {
            return;
        }
    };

    const undoEditor = () => {
        if (!editorRef.current) {
            return;
        }
        editorRef.current.trigger("keyboard","undo",null);
    };

    const redoEditor = () => {
        if (!editorRef.current) {
            return;
        }
        editorRef.current.trigger("keyboard", "redo", null);
    };

    const loadGitStatus = useCallback(async () => {
        try {
            setLoadingGit(true);
            const response = await API.get(`/projects/${projectId}/git/status`);
            setGitStatus(response.data);
        } catch (error) {
            console.error("Failed to load Git status:", error);
            setError(error.response?.data?.error || "Failed to load Git status");
        } finally {
            setLoadingGit(false);
        }
    }, [projectId]);

    const loadGitBranches = useCallback(async () => {
        try {
            setLoadingGitBranches(true);
            const response = await API.get(`/projects/${projectId}/git/branches`);
            setGitBranches(response.data.branches || []);
        } catch (error) {
            console.error("Failed to load Git branches:", error);
            setError(error.response?.data?.error || "Failed to load Git branches");
        } finally {
            setLoadingGitBranches(false);
        }
    }, [projectId]);

    const loadGitHistory = useCallback(async () => {
        try {
            setLoadingGitHistory(true);
            const response = await API.get(`/projects/${projectId}/git/history`);
            setGitHistory(response.data.commits || []);
        } catch (error) {
            console.error("Failed to load Git history:", error);
            setError(error.response?.data?.error || "Failed to load Git history");
        } finally {
            setLoadingGitHistory(false);
        }
    }, [projectId]);

    const openGitDiff = async (file, staged = false) => {
        try {
            setSelectedGitFile({
                ...file,
                diffStaged: staged
            });
            setGitDiff("");
            const response = await API.get(`/projects/${projectId}/git/diff`, {
                params: {
                    file: file.path,
                    staged
                }
            });
            setGitDiff(response.data.diff || "");
        } catch (error) {
            console.error("Failed to load Git diff:", error);
            setError(error.response?.data?.error || "Failed to load Git diff");
        }
    };

    const stageGitFile = async (file) => {
        try {
            setGitActionLoading(true);
            setError("");
            await API.post(`/projects/${projectId}/git/stage`, {
                file: file.path
            });
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to stage Git file:",error);
            setError(error.response?.data?.error || "Failed to stage file");
        } finally {
            setGitActionLoading(false);
        }
    };

    const unstageGitFile = async (file) => {
        try {
            setGitActionLoading(true);
            setError("");
            await API.post(`/projects/${projectId}/git/unstage`, {
                file: file.path
            });
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to unstage Git file:", error);
            setError(error.response?.data?.error || "Failed to unstage file");
        } finally {
            setGitActionLoading(false);
        }
    };

    const createGitBranch = async () => {
        const name = newBranchName.trim();
        if (!name) {
            setError("Please enter a branch name");
            return;
        }

        try {
            setGitActionLoading(true);
            setError("");
            await API.post(`/projects/${projectId}/git/branches`, {
                name
            });
            setNewBranchName("");
            await loadGitBranches();
            await loadGitStatus();
            await refreshExplorer();
            setSaveMessage(`Created branch "${name}"`);
            toast.success(`Branch "${name}" created`);
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
        } catch (error) {
            console.error("Failed to create branch:", error);
            setError(error.response?.data?.error || "Failed to create branch");
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setGitActionLoading(false);
        }
    };

    const checkoutGitBranch = async (name) => {
        if (!name || name === gitStatus?.branch) {
            return;
        }
        try {
            setGitActionLoading(true);
            setError("");
            await API.post(`/projects/${projectId}/git/checkout`, {
                name
            });
            setSelectedGitFile(null);
            setGitDiff("");
            await loadGitBranches();
            await loadGitStatus();
            await syncWorkspaceFromServer();
            setSaveMessage(`Switched to "${name}"`);
            toast.success(`Switched to "${name}"`);
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
        } catch (error) {
            console.error("Failed to switch branch:", error);
            setError(error.response?.data?.error || "Failed to switch branch");
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setGitActionLoading(false);
        }
    };

    const commitGitChanges = async () => {
        if (!commitMessage.trim()) {
            setError("Please enter a commit message");
            return;
        }
        try {
            setGitActionLoading(true);
            setError("");
            await API.post(`/projects/${projectId}/git/commit`, {
                message: commitMessage.trim()
            });
            setCommitMessage("");
            setSelectedGitFile(null);
            setGitDiff("");
            await loadGitStatus();
            setSaveMessage("Changes committed successfully");
            toast.success("Changes committed successfully");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
        } catch (error) {
            console.error("Git commit failed:", error);
            setError(error.response?.data?.error || "Failed to commit changes");
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setGitActionLoading(false);
        }
    };

    const pullGitChanges = async () => {
        try {
            setGitActionLoading(true);
            setError("");
            const response = await API.post(`/projects/${projectId}/git/pull`);
            await loadGitStatus();
            await syncWorkspaceFromServer();
            setSaveMessage(response.data.message || "Changes pulled successfully");
            toast.success(response.data.message || "Changes pulled successfully");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
        } catch (error) {
            console.error("Git pull failed:", error);
            setError(error.response?.data?.error || "Failed to pull changes");
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setGitActionLoading(false);
        }
    };

    const pushGitChanges = async () => {
        try {
            setGitActionLoading(true);
            setError("");
            const response = await API.post(`/projects/${projectId}/git/push`);
            await loadGitStatus();
            setSaveMessage(response.data.message || "Changes pushed successfully");
            toast.success(response.data.message || "Changes pushed successfully");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
        } catch (error) {
            console.error("Git push failed:", error);
            setError(error.response?.data?.error || "Failed to push changes");
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setGitActionLoading(false);
        }
    };

    useEffect(() => {
        if (!showSourceControl) {
            return;
        }
        loadGitStatus();
        loadGitBranches();
        loadGitHistory();
    }, [showSourceControl,loadGitStatus,loadGitBranches,loadGitHistory]);

    const refreshExplorer = async () => {
        try {
            setRefreshing(true);
            await syncWorkspaceFromServer();
        } catch (error) {
            // syncWorkspaceFromServer already set the error.
        } finally {
            setRefreshing(false);
        }
    };

    const createNewFile = async (filePath) => {
        try {
            setCreatingFile(true);
            setError("");
            const response = await API.post( `/projects/${projectId}/files`, {
                filePath,
                content: ""
            });
            const newFile = response.data.file;
            setFiles((previousFiles) => [
                ...previousFiles,
                newFile
            ]);
            await selectFile(newFile, true);
            toast.success("File created successfully");
        } catch (error) {
            console.error("Failed to create file:", error);
            setError(error.response?.data?.error || "Failed to create file");
        } finally {
            setCreatingFile(false);
        }
    };

    const renameFile = async (file, newName) => {
        try {
            const response = await API.patch(
                `/projects/${projectId}/files/${file._id}/rename`,
                {
                    newName
                }
            );

            const renamedFile = response.data.file;

            setFiles((previousFiles) =>
                previousFiles.map((item) =>
                    item._id === renamedFile._id
                        ? renamedFile
                        : item
                )
            );

            toast.success("File renamed successfully");

            return renamedFile;
        } catch (error) {
            console.error("Failed to rename file:", error);
            setError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to rename file"
            );

            return null;
        }
    };

    const createNewFolder = async (folderPath) => {
        try {
            setCreatingFolder(true);
            setError("");
            const response = await API.post(`/projects/${projectId}/folders`, {
                folderPath
            });
            const newFolder = response.data.folder;
            setFiles((previousFiles) => [
                ...previousFiles,
                newFolder
            ]);
            await refreshExplorer();
            toast.success("Folder created successfully");
        } catch (error) {
            console.error("Failed to create folder:", error);
            setError(error.response?.data?.error || "Failed to create folder");
        } finally {
            setCreatingFolder(false);
        }
    };

    const runTerminal = async (event) => {
        event?.preventDefault();
        const command = terminalInput.trim();
        if (!command || runningTerminal) {
            return;
        }
        setRunningTerminal(true);
        setError("");
        setTerminalOutput((previous) => [
            ...previous,
            {
                type: "command",
                text: `$ ${command}`
            }
        ]);
        setTerminalInput("");
        try {
            const response = await API.post(`/projects/${projectId}/terminal`,{
                command
            });
            const result = response.data.result;
            if (result.success) {
                toast.success("Command completed");
            } else {
                toast.error(`Command failed (exit code ${result.exitCode})`);
            }
            if (result.success) {
                await syncWorkspaceFromServer();
            }
            setTerminalOutput((previous) => [
                ...previous,
                ...(result.stdout
                    ? [
                        {
                            type: "stdout",
                            text: result.stdout
                        }
                    ]
                    : []),
                ...(result.stderr
                    ? [
                        {
                            type: "stderr",
                            text: result.stderr
                        }
                    ]
                    : []),
                {
                    type: result.success
                        ? "status"
                        : "error",
                    text:
                        result.success
                            ? `Process exited with code 0`
                            : `Process exited with code ${result.exitCode}`
                }
            ]);
        } catch (error) {
            setTerminalOutput((previous) => [
                ...previous,
                {
                    type: "error",
                    text: error.response?.data?.error || error.message || "Failed to run terminal command"
                }
            ]);
        } finally {
            setRunningTerminal(false);
        }
    };

    const clearTerminal = () => {
        setTerminalOutput([]);
    };

    const generateMultiFileFromPrompt = async () => {
        const instruction = question.trim();
        if (!instruction) {
            setError("Enter a description of the project changes you want.");
            return;
        }
        if (!selectedFile?._id) {
            setError("Open a project file before generating changes.");
            return;
        }
        setGeneratingMultiFile(true);
        setShowMultiFileGeneration(false);
        setMultiFileResult(null);
        setMultiFileIndex(0);
        setMultiFileReview({});
        setError("");
        try {
            const response = await API.post(`/projects/${projectId}/generate-multi`, {
                instruction,
                currentFilePath: selectedFile.path,
                currentFileContent: fileContent
            });
            if (!Array.isArray(response.data?.changes) || response.data.changes.length === 0) {
                throw new Error("AI did not return any file changes.");
            }
            const generatedChanges = response.data.changes;
            const originalContents = {};
            for (const change of generatedChanges) {
                const normalizedPath = change.filePath.replace(/\\/g, "/");
                const existingFile = files.find((file) =>  file.path.replace(/\\/g, "/") === normalizedPath);
                if (existingFile?._id) {
                    try {
                        const fileResponse = await API.get(`/projects/${projectId}/files/${existingFile._id}/content`);
                        originalContents[normalizedPath] = fileResponse.data.content || "";
                    } catch (error) {
                        console.error(`Failed to load original content for ${normalizedPath}:`, error);
                        originalContents[normalizedPath] = "";
                    }
                }
            }
            setMultiFileOriginalContents(originalContents);
            const initialReview = {};
            generatedChanges.forEach((change) => {
                const normalizedPath = change.filePath.replace(/\\/g, "/");
                initialReview[normalizedPath] = "pending";
            });
            setMultiFileReview(initialReview);
            setMultiFileResult({
                summary: response.data.summary ||  "AI proposed multiple file changes.",
                changes: generatedChanges
            });
            setShowMultiFileGeneration(true);
            setQuestion("");
            toast.success("Multi-file changes generated");
        } catch (error) {
            console.error("Multi-file generation failed:", error);
            setError(error.response?.data?.error || error.message || "Failed to generate multi-file changes");
            toast.error(error.response?.data?.error || error.message || "Failed to generate multi-file changes");
        } finally {
            setGeneratingMultiFile(false);
        }
    };

    const setMultiFileReviewStatus = (
        filePath,
        status
    ) => {
        const normalizedPath =
            filePath.replace(/\\/g, "/");

        setMultiFileReview((previous) => ({
            ...previous,
            [normalizedPath]: status
        }));
    };

    const applyReviewedMultiFileChanges = async () => {
        if (!multiFileResult?.changes?.length) {
            return;
        }
        const acceptedChanges = multiFileResult.changes.filter((change) => {
            const normalizedPath = change.filePath.replace(/\\/g, "/");
            return (multiFileReview[normalizedPath] === "accepted");
        });
        if (acceptedChanges.length === 0) {
            setError("Accept at least one file before applying the review.");
            return;
        }
        const hasDirtyFiles = isDirty ||  Object.values(dirtyTabs).some(Boolean);
        if (hasDirtyFiles) {
            setError("Save all unsaved files before accepting multi-file changes.");
            return;
        }
        try {
            setApplyingMultiFile(true);
            setError("");
            const updatedFiles = [];
            for (const change of acceptedChanges) {
                const normalizedPath = change.filePath.replace(/\\/g,"/");
                const existingFile = files.find((file) => file.path.replace(/\\/g,"/") === normalizedPath);
                if (change.action === "update") {
                    if (!existingFile) {
                        throw new Error(`Cannot update missing file: ${normalizedPath}`);
                    }
                    await API.put(`/projects/${projectId}/files/${existingFile._id}/content`, {
                        content: change.content
                    });
                    updatedFiles.push(existingFile);
                    setTabContents((previous) => ({
                        ...previous,
                        [existingFile._id]: change.content
                    }));
                    setDirtyTabs((previous) => {
                        const updated = {
                            ...previous
                        };
                        delete updated[existingFile._id];
                        return updated;
                    });
                    if (selectedFile?._id === existingFile._id) {
                        setFileContent(change.content);
                        setIsDirty(false);
                    }
                }
                if (change.action === "create") {
                    if (existingFile) {
                        throw new Error(`File already exists: ${normalizedPath}`);
                    }
                    const response = await API.post(`/projects/${projectId}/files`, {
                        filePath: normalizedPath,
                        content: change.content
                    });
                    if (response.data?.file) {
                        updatedFiles.push(response.data.file);
                    }
                }
            }
            if (updatedFiles.length > 0) {
                setFiles((previousFiles) => {
                    const nextFiles = [...previousFiles];
                    updatedFiles.forEach((updatedFile) => {
                        const index = nextFiles.findIndex((file) => file._id === updatedFile._id);
                        if (index >= 0) {
                            nextFiles[index] = {
                                ...nextFiles[index],
                                ...updatedFile
                            };
                        } else {
                            nextFiles.push(updatedFile);
                        }
                    });
                    return nextFiles;
                });
            }
            const acceptedCount = acceptedChanges.length;
            const rejectedCount = multiFileResult.changes.length - acceptedCount;
            setShowMultiFileGeneration(false);
            setMultiFileResult(null);
            setMultiFileIndex(0);
            setMultiFileReview({});
            setMultiFileOriginalContents({});
            setSaveMessage(`${acceptedCount} file change${acceptedCount === 1 ? "" : "s"} applied${rejectedCount > 0 ? `, ${rejectedCount} rejected` : ""}`);
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
            await syncWorkspaceFromServer(acceptedChanges.map((change) => change.path));
        } catch (error) {
            console.error("Failed to apply reviewed multi-file changes:", error);
            setError(error.response?.data?.error || error.message || "Failed to apply reviewed multi-file changes");
        } finally {
            setApplyingMultiFile(false);
        }
    };

    const rejectMultiFileChanges = () => {
        setShowMultiFileGeneration(false);
        setMultiFileResult(null);
        setMultiFileIndex(0);
        setMultiFileReview({});
        setMultiFileOriginalContents({});
    };

    const commandPaletteCommands = [
        {
            id: "review",
            label: "Review Project",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                reviewProject();
            }
        },
        {
            id: "build",
            label: "Run Build",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                runBuild();
            }
        },
        {
            id: "diagnose",
            label: "Diagnose Build",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                diagnoseBuild();
            }
        },
        {
            id: "terminal",
            label: "Toggle Terminal",
            shortcut: "Ctrl+`",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                setShowTerminal((previous) => {
                    const next = !previous;
                    if (next) {
                        setShowProblems(false);
                    }
                    return next;
                });
            }
        },
        {
            id: "problems",
            label: "Toggle Problems",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                setShowProblems((previous) => {
                    const next = !previous;
                    if (next) {
                        setShowTerminal(false);
                    }
                    return next;
                });
            }
        },
        {
            id: "search",
            label: "Search Project",
            shortcut: "Ctrl+Shift+F",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                setShowSearch(true);
            }
        },
        {
            id: "save",
            label: "Save Current File",
            shortcut: "Ctrl+S",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                requestSave();
            }
        },
        {
            id: "refresh",
            label: "Refresh Explorer",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                refreshExplorer();
            }
        },
        {
            id: "clear-terminal",
            label: "Clear Terminal",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                clearTerminal();
            }
        },
        {
            id: "generate",
            label: "Generate Code",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                setShowAI(true);
                setTimeout(() => {
                    aiInputRef.current?.focus();
                }, 0);
            }
        },
        {
            id: "generate-multi",
            label: "Generate Multi-File Changes",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                setShowAI(true);
                setTimeout(() => {
                    aiInputRef.current?.focus();
                }, 0);
            }
        },
        {
            id: "test",
            label: "Run Tests",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                runTests();
            }
        },
        {
            id: "generate-tests",
            label: "Generate Tests",
            shortcut: "",
            action: () => {
                setShowCommandPalette(false);
                setCommandPaletteQuery("");
                generateTestsFromFile();
            }
        },
    ];

    const filteredCommandPaletteCommands = commandPaletteCommands.filter((command) =>
        command.label.toLowerCase().includes(commandPaletteQuery.trim().toLowerCase())
    );

    const generateCodeFromPrompt = async () => {
        const instruction = question.trim();
        if (!instruction) {
            setError("Enter a description of the code you want to generate.");
            return;
        }
        if (!selectedFile?._id) {
            setError("Open a file before generating code.");
            return;
        }
        if (!editorRef.current) {
            setError("Editor is not ready.");
            return;
        }
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) {
            setError("Editor model is not available.");
            return;
        }
        const selection = editor.getSelection();
        if (!selection) {
            setError("No editor position is available.");
            return;
        }
        const original = selection.isEmpty() ? "" : model.getValueInRange(selection);
        generationRangeRef.current = {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn
        };
        setGenerationOriginal(original);
        setGeneratingCode(true);
        setShowGeneration(false);
        setGenerationResult(null);
        setError("");
        try {
            const response = await API.post(`/projects/${projectId}/generate`, {
                instruction,
                filePath: selectedFile.path,
                currentFileContent: fileContent,
                selectedCode: original
            });
            if (!response.data?.code) {
                throw new Error("AI did not return generated code.");
            }
            setGenerationResult({
                explanation: response.data.explanation || "Generated code.",
                operation: response.data.operation || "insert",
                location: response.data.location || "cursor",
                code: response.data.code || ""
            });
            toast.success("Code generated successfully");
            setShowGeneration(true);
            setQuestion("");
        } catch (error) {
            console.error("Code generation failed:", error);
            setError(error.response?.data?.error || error.message || "Failed to generate code");
            toast.error(error.response?.data?.error || error.message || "Failed to generate code");
        } finally {
            setGeneratingCode(false);
        }
    };

    const applyGeneratedCode = async () => {
        if (!generationResult?.code || !editorRef.current || !selectedFile?._id) {
            return;
        }
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) {
            return;
        }
        let range = generationRangeRef.current;
        if (generationResult.operation === "rewrite") {
            range = {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: model.getLineCount(),
                endColumn: model.getLineMaxColumn(model.getLineCount())
            };
        }
        if (generationResult.operation === "insert") {
            if (generationResult.location === "start") {
                range = {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1
                };
            } else if (generationResult.location === "end") {
                const lastLine = model.getLineCount();
                const lastColumn = model.getLineMaxColumn(lastLine);
                range = {
                    startLineNumber: lastLine,
                    startColumn: lastColumn,
                    endLineNumber: lastLine,
                    endColumn: lastColumn
                };
            }
        }
        if ((generationResult.operation === "replace" ||
            generationResult.operation === "delete") &&
            ((!range || generationResult.operation === "replace") && generationOriginal === "")) {
            setError("Select the code you want to replace or delete.");
            return;
        }

        if (!range) {
            setError("Generation position is no longer available.");
            return;
        }
        try {
            setApplyingGeneration(true);
            setError("");
            model.pushEditOperations([], [
                {
                    range,
                    text: generationResult.operation === "delete"
                        ? ""
                        : generationResult.code
                }
            ], () => null);
            await saveCurrentFile();
            setShowGeneration(false);
            setGenerationResult(null);
            setGenerationOriginal("");
            generationRangeRef.current = null;
            setSaveMessage("AI code generated and saved");
            toast.success("AI code generated and saved");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
        } catch (error) {
            console.error("Failed to apply generated code:", error);
            setError(error.response?.data?.error || error.message || "Failed to apply generated code");
            toast.error(error.response?.data?.error || error.message || "Failed to apply generated code");
        } finally {
            setApplyingGeneration(false);
        }
    };

    const rejectGeneratedCode = () => {
        setShowGeneration(false);
        setGenerationResult(null);
        setGenerationOriginal("");
        generationRangeRef.current =
            null;
    };

    const generateTestsFromFile = async () => {
        if (!selectedFile?._id) {
            setError("Open a file before generating tests.");
            return;
        }
        if (!fileContent.trim()) {
            setError("The current file has no code to test.");
            return;
        }
        setGeneratingTests(true);
        setShowTestGeneration(false);
        setTestGenerationResult(null);
        setError("");

        try {
            const response = await API.post(`/projects/${projectId}/generate-tests`, {
                filePath: selectedFile.path,
                sourceCode: fileContent
            });
            if (!response.data?.code || !response.data?.testFilePath) {
                throw new Error("AI did not return a valid test file.");
            }
            setTestGenerationResult({
                testFilePath: response.data.testFilePath,
                framework: response.data.framework || "Unknown",
                explanation: response.data.explanation || "AI generated tests for the current file.",
                code: response.data.code
            });
            toast.success("Tests generated successfully");
            setShowTestGeneration(true);
        } catch (error) {
            console.error("Test generation failed:", error);
            setError(error.response?.data?.error || error.message || "Failed to generate tests");
            toast.error(error.response?.data?.error || error.message || "Failed to generate tests");
        } finally {
            setGeneratingTests(false);
        }
    };

    const acceptGeneratedTests = async () => {
        if (!testGenerationResult?.testFilePath || !testGenerationResult?.code) {
            return;
        }
        setApplyingTests(true);
        setError("");
        try {
            const normalizedPath = testGenerationResult.testFilePath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
            const existingFile = files.find((file) => file.path.replace(/\\/g, "/") === normalizedPath);
            let createdOrUpdatedFile = null;
            if (existingFile) {
                const response = await API.put(`/projects/${projectId}/files/${existingFile._id}/content`, {
                    content: testGenerationResult.code
                });
                createdOrUpdatedFile = response.data.file || existingFile;
                setTabContents((previous) => ({
                    ...previous,
                    [existingFile._id]: testGenerationResult.code
                }));
                setDirtyTabs((previous) => {
                    const updated = {
                        ...previous
                    };
                    delete updated[existingFile._id];
                    return updated;
                });
                if (selectedFile?._id === existingFile._id) {
                    setFileContent(testGenerationResult.code);
                    setIsDirty(false);
                }
            } else {
                const response = await API.post(`/projects/${projectId}/files`, {
                    filePath: normalizedPath,
                    content: testGenerationResult.code
                });
                createdOrUpdatedFile = response.data.file;
            }
            if (createdOrUpdatedFile) {
                setFiles((previousFiles) => {
                    const index = previousFiles.findIndex((file) => file._id === createdOrUpdatedFile._id);
                    if (index >= 0) {
                        const updated = [...previousFiles];
                        updated[index] = {
                            ...updated[index],
                            ...createdOrUpdatedFile
                        };
                        return updated;
                    }
                    return [
                        ...previousFiles,
                        createdOrUpdatedFile
                    ];
                });
            }
            setShowTestGeneration(false);
            setTestGenerationResult(null);
            setSaveMessage("Tests generated and saved successfully");
            toast.success("Tests generated and saved");
            setTimeout(() => {
                setSaveMessage("");
            }, 2500);
            await syncWorkspaceFromServer([normalizedPath]);
        } catch (error) {
            console.error("Failed to save generated tests:", error);
            setError(error.response?.data?.error || error.message || "Failed to save generated tests");
            toast.error(error.response?.data?.error || error.message || "Failed to save generated tests");
        } finally {
            setApplyingTests(false);
        }
    };

    const rejectGeneratedTests = () => {
        setShowTestGeneration(false);
        setTestGenerationResult(null);
    };

    const generateAgentPlan = async () => {
        const instruction = question.trim();
        setAgentInstruction(instruction);
        if (!instruction) {
            setError("Describe what you want the AI agent to do.");
            return;
        }
        setPlanningAgent(true);
        setAgentPlan(null);
        setShowAgentPlan(false);
        setError("");
        try {
            const response = await API.post(`/projects/${projectId}/agent/plan`, {
                instruction
            });
            if (!response.data?.steps || !Array.isArray(response.data.steps) || response.data.steps.length === 0) {
                throw new Error("AI did not return a valid implementation plan.");
            }
            setAgentPlan({
                taskId: response.data.taskId,
                summary: response.data.summary || "Implementation plan generated.",
                steps: response.data.steps
            });
            setShowAgentPlan(true);
            setQuestion("");
            toast.success("Agent plan generated");
        } catch (error) {
            console.error("Agent planning failed:", error);
            setError(error.response?.data?.error || error.message || "Failed to generate agent plan");
            toast.error(error.response?.data?.error || error.message || "Failed to generate agent plan");
        } finally {
            setPlanningAgent(false);
        }
    };

    const rejectAgentPlan = () => {
        setShowAgentPlan(false);
        setAgentPlan(null);
        setAgentInstruction("");
    };

    useEffect(() => {
        localStorage.setItem("ai-devos-show-ai", String(showAI));
    }, [showAI]);

    useEffect(() => {
        localStorage.setItem("ai-devos-explorer-width", String(explorerWidth));
    }, [explorerWidth]);

    useEffect(() => {
        localStorage.setItem("ai-devos-ai-width", String(aiWidth));
    }, [aiWidth]);

    const executeAgent = async () => {
        if (!agentPlan || !Array.isArray(agentPlan.steps) || agentPlan.steps.length === 0) {
            setError("No valid agent plan is available.");
            return;
        }
        if (!agentInstruction.trim()) {
            setError("The original agent instruction is missing.");
            return;
        }
        setExecutingAgent(true);
        setAgentExecutionResult(null);
        setError("");
        try {
            const response = await API.post(`/projects/${projectId}/agent/execute`,
                {
                    taskId: agentPlan.taskId,
                    instruction: agentInstruction.trim(),
                    plan: agentPlan
                }
            );
            setAgentExecutionResult(response.data);
            setShowAgentPlan(false);
            setAgentPlan(null);
            setAgentInstruction("");
            await syncWorkspaceFromServer(response.data.changedFiles || []);
            toast.success("Agent execution completed");
        } catch (error) {
            console.error("Agent execution failed:", error);
            setError(error.response?.data?.error || error.message || "Failed to execute agent plan");
            toast.error(error.response?.data?.error || error.message || "Agent execution failed");
        } finally {
            setExecutingAgent(false);
        }
    };

    useEffect(() => {
        if (aiButtonPosition.x === null || aiButtonPosition.y === null) {
            return;
        }
        localStorage.setItem("ai-devos-ai-button-position", JSON.stringify(aiButtonPosition));
    }, [aiButtonPosition]);

    const deleteFile = async (file) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${file.name}"?`
        );

        if (!confirmed) {
            return false;
        }

        try {
            const response = await API.delete(
                `/projects/${projectId}/files/${file._id}`
            );

            setFiles((previousFiles) =>
                previousFiles.filter(
                    (item) => item._id !== file._id
                )
            );

            toast.success(
                response.data.message || "File deleted successfully"
            );

            return true;
        } catch (error) {
            console.error("Failed to delete file:", error);

            setError(
                error.response?.data?.error ||
                "Failed to delete file"
            );

            return false;
        }
    };

    const renameFolder = async (folder, newName) => {
        try {
            const response = await API.patch(
                `/projects/${projectId}/folders/${folder._id}/rename`,
                {
                    newName
                }
            );

            const renamedFolder = response.data.folder;
            const oldPath = folder.path.replace(/\\/g, "/");
            const newPath = renamedFolder.path.replace(/\\/g, "/");
            const oldPrefix = `${oldPath}/`;
            const newPrefix = `${newPath}/`;

            setFiles((previousFiles) =>
                previousFiles.map((item) => {
                    const itemPath = item.path.replace(/\\/g, "/");

                    if (item._id === renamedFolder._id) {
                        return renamedFolder;
                    }

                    if (itemPath.startsWith(oldPrefix)) {
                        return {
                            ...item,
                            path:
                                newPrefix +
                                itemPath.slice(oldPrefix.length)
                        };
                    }

                    return item;
                })
            );

            toast.success("Folder renamed successfully");

            return renamedFolder;
        } catch (error) {
            console.error("Failed to rename folder:", error);

            setError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to rename folder"
            );

            return null;
        }
    };

    const deleteFolder = async (folder) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the folder "${folder.name}" and everything inside it?`
        );

        if (!confirmed) {
            return false;
        }

        try {
            const response = await API.delete(
                `/projects/${projectId}/folders/${folder._id}`
            );

            const folderPath = folder.path
                .replace(/\\/g, "/")
                .replace(/\/+$/, "");

            const folderPrefix = `${folderPath}/`;

            setFiles((previousFiles) =>
                previousFiles.filter((item) => {
                    const itemPath = item.path.replace(/\\/g, "/");

                    return (
                        item._id !== folder._id &&
                        !itemPath.startsWith(folderPrefix)
                    );
                })
            );

            toast.success(
                response.data.message || "Folder deleted successfully"
            );

            return true;
        } catch (error) {
            console.error("Failed to delete folder:", error);

            setError(
                error.response?.data?.error ||
                "Failed to delete folder"
            );

            return false;
        }
    };

    useEffect(() => {
        if (!error) {
            return;
        }

        const timer = setTimeout(() => {
            setError("");
        }, 3000);

        return () => {
            clearTimeout(timer);
        };
    }, [error]);

    const loadConversations = useCallback(async () => {
        try {
            setLoadingConversations(true);

            const response = await API.get(
                `/projects/${projectId}/conversations`
            );

            const loadedConversations =
                response.data.conversations || [];

            setConversations(loadedConversations);

            if (loadedConversations.length > 0) {
                setActiveConversationId(
                    loadedConversations[0]._id
                );
            } else {
                setActiveConversationId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Failed to load conversations:", error);

            setError(
                error.response?.data?.error ||
                "Failed to load conversations"
            );
        } finally {
            setLoadingConversations(false);
        }
    }, [projectId]);

    const loadConversationMessages = useCallback(
        async (conversationId) => {
            if (!conversationId) {
                setMessages([]);
                return;
            }

            try {
                const response = await API.get(
                    `/projects/${projectId}/conversations/${conversationId}/messages`
                );

                const loadedMessages =
                    response.data.messages || [];

                setMessages(
                    loadedMessages.map((message) => ({
                        _id: message._id,
                        role: message.role,
                        content: message.content,
                        filePath: message.filePath,
                        selectedCode: message.selectedCode
                    }))
                );
            } catch (error) {
                console.error(
                    "Failed to load conversation messages:",
                    error
                );

                setError(
                    error.response?.data?.error ||
                    "Failed to load conversation messages"
                );
            }
        },
        [projectId]
    );

    const createNewConversation = useCallback(async () => {
        try {
            const response = await API.post(
                `/projects/${projectId}/conversations`,
                {
                    title: "New conversation"
                }
            );

            const newConversation =
                response.data.conversation;

            setConversations((previous) => [
                newConversation,
                ...previous
            ]);

            setActiveConversationId(newConversation._id);
            setMessages([]);
            setQuestion("");
        } catch (error) {
            console.error(
                "Failed to create conversation:",
                error
            );

            setError(
                error.response?.data?.error ||
                "Failed to create conversation"
            );
        }
    }, [projectId]);

    useEffect(() => {
        loadConversationMessages(activeConversationId);
    }, [
        activeConversationId,
        loadConversationMessages
    ]);

    useEffect(() => {
        if (!projectId) {
            return;
        }

        loadConversations();
    }, [projectId, loadConversations]);

    const editMessage = (
        messageContent,
        messageIndex,
        messageId
    ) => {
        setQuestion(messageContent);
        setEditingMessageIndex(messageIndex);
        setEditingMessageId(messageId);
    };

    const deleteConversation = async (conversationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this conversation?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await API.delete(
                `/projects/${projectId}/conversations/${conversationId}`
            );

            setConversations((previous) =>
                previous.filter(
                    (conversation) =>
                        conversation._id !== conversationId
                )
            );

            if (activeConversationId === conversationId) {
                const remainingConversations =
                    conversations.filter(
                        (conversation) =>
                            conversation._id !== conversationId
                    );

                if (remainingConversations.length > 0) {
                    setActiveConversationId(
                        remainingConversations[0]._id
                    );
                } else {
                    setActiveConversationId(null);
                    setMessages([]);
                }
            }

            toast.success("Conversation deleted");
        } catch (error) {
            console.error(
                "Failed to delete conversation:",
                error
            );

            toast.error(
                error.response?.data?.error ||
                "Failed to delete conversation"
            );
        }
    };

    const renameConversation = async (conversationId, currentTitle) => {
        const newTitle = window.prompt(
            "Enter a new conversation name:",
            currentTitle
        );

        if (newTitle === null) {
            return;
        }

        const cleanTitle = newTitle.trim();

        if (!cleanTitle) {
            return;
        }

        try {
            const response = await API.put(
                `/projects/${projectId}/conversations/${conversationId}`,
                {
                    title: cleanTitle
                }
            );

            const updatedConversation =
                response.data.conversation;

            setConversations((previous) =>
                previous.map((conversation) =>
                    conversation._id === conversationId
                        ? {
                            ...conversation,
                            title: updatedConversation.title
                        }
                        : conversation
                )
            );

            toast.success("Conversation renamed");
        } catch (error) {
            console.error(
                "Failed to rename conversation:",
                error
            );

            toast.error(
                error.response?.data?.error ||
                "Failed to rename conversation"
            );
        }
    };

    const cancelEditMessage = () => {
        setQuestion("");
        setEditingMessageIndex(null);
        setEditingMessageId(null);
    };

    if (loading) {
        return (
            <div className="workspace-state">
                <div className="workspace-state-inner">
                    <div className="workspace-state-orb" />
                    <div>Loading workspace...</div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="workspace-state">
                <div className="workspace-state-inner">
                    <div className="workspace-state-orb" />
                    <div>{error || "Project not found"}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="workspace-page">
            <WorkspaceHeader
                project={project}
                navigate={navigate}
                saveMessage={saveMessage}
                isDirty={isDirty}
                selectedFile={selectedFile}
                savingFile={savingFile}
                requestSave={requestSave}
            />

            <div
                className={`workspace-body ${showAI ? "" : "workspace-body--ai-closed"}`}
                style={{
                    "--workspace-explorer-width": `${explorerWidth}px`,
                    "--workspace-ai-width": `${aiWidth}px`
                }}
            >

                <aside className="workspace-explorer">
                    <WorkspaceExplorer
                        files={files}
                        showSearch={showSearch}
                        setShowSearch={setShowSearch}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchResults={searchResults}
                        searchingFiles={searchingFiles}
                        openSearchResult={openSearchResult}
                        requestFileSwitch={requestFileSwitch}
                        createNewFile={createNewFile}
                        onRenameFile={renameFile}
                        onDeleteFile={deleteFile}
                        onRenameFolder={renameFolder}
                        onDeleteFolder={deleteFolder}
                        createNewFolder={createNewFolder}
                        refreshExplorer={refreshExplorer}
                        creatingFile={creatingFile}
                        creatingFolder={creatingFolder}
                        refreshing={refreshing}
                    />

                    <div className="workspace-explorer-bottom-actions">
                    <button
                        type="button"
                        className="workspace-explorer-action"
                        onClick={undoEditor}
                        disabled={!selectedFile}
                        title="Undo"
                    >
                        ↶
                        <span>Undo</span>
                    </button>

                    <button
                        type="button"
                        className="workspace-explorer-action"
                        onClick={redoEditor}
                        disabled={!selectedFile}
                        title="Redo"
                    >
                        ↷
                        <span>Redo</span>
                    </button>

                    <button
                        type="button"
                        className={`workspace-explorer-action ${
                            getProblems().length > 0
                                ? "workspace-explorer-action--problems"
                                : ""
                        }`}
                        onClick={() => setShowProblems((previous) => !previous)}
                        title="Problems"
                    >
                        ⚠
                        <span>
                            Problems {getProblems().length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`workspace-explorer-action ${
                            showTerminal
                                ? "workspace-explorer-action--terminal-active"
                                : ""
                        }`}
                        onClick={() => setShowTerminal((previous) => !previous)}
                        title="Integrated Terminal (Ctrl+`)"
                    >
                        &gt;_
                        <span>Terminal</span>
                    </button>
                </div>
                </aside>

                {!showAI && (
                    <button
                        type="button"
                        className="workspace-ai-floating-toggle"
                        onMouseDown={startAIButtonDrag}
                        onClick={() => {
                            if (aiButtonDraggingRef.current) {
                                return;
                            }
                            setShowAI(true);
                        }}
                        style={
                            aiButtonPosition.x !== null &&
                            aiButtonPosition.y !== null
                                ? {
                                    left: `${aiButtonPosition.x}px`,
                                    top: `${aiButtonPosition.y}px`,
                                    right: "auto"
                                }
                                : undefined
                        }
                        aria-label="Open AI panel"
                        title="Drag to move • Click to open AI"
                    >
                        AI
                    </button>
                )}

                <div
                    className="workspace-resize-handle workspace-resize-handle--explorer"
                    onMouseDown={(event) => startResize("explorer", event)}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize explorer"
                />

                <main className="workspace-editor">
                    <WorkspaceEditor
                        openTabs={openTabs}
                        selectedFile={selectedFile}
                        dirtyTabs={dirtyTabs}
                        switchToTab={switchToTab}
                        closeTab={closeTab}
                        undoEditor={undoEditor}
                        redoEditor={redoEditor}
                        getProblems={getProblems}
                        setEditorProblems={setEditorProblems}
                        showTerminal={showTerminal}
                        setShowProblems={setShowProblems}
                        setShowTerminal={setShowTerminal}
                        editorRef={editorRef}
                        selectionRef={selectionRef}
                        setSelectedCode={setSelectedCode}
                        setFileContent={setFileContent}
                        setIsDirty={setIsDirty}
                        setSaveMessage={setSaveMessage}
                        setTabContents={setTabContents}
                        setDirtyTabs={setDirtyTabs}
                        fileContent={fileContent}
                        getLanguage={getLanguage}
                    />

                    <WorkspaceProblems
                        showProblems={showProblems}
                        setShowProblems={setShowProblems}
                        getProblems={getProblems}
                        openSource={openSource}
                    />

                    <WorkspaceTerminal
                        showTerminal={showTerminal}
                        setShowTerminal={setShowTerminal}
                        clearTerminal={clearTerminal}
                        runningTerminal={runningTerminal}
                        terminalOutput={terminalOutput}
                        terminalInput={terminalInput}
                        setTerminalInput={setTerminalInput}
                        runTerminal={runTerminal}
                    />
                </main>

                {showAI && (
                    <div
                        className="workspace-resize-handle workspace-resize-handle--ai"
                        onMouseDown={(event) => startResize("ai", event)}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize AI panel"
                    />
                )}

                {showAI && (
                    <aside className="workspace-ai">
                        <button
                            type="button"
                            className="workspace-ai-toggle"
                            onClick={() => setShowAI(false)}
                            aria-label="Close AI panel"
                            title="Close AI panel"
                        >
                            ×
                        </button>

                        <WorkspaceAIHeader
                            setShowSourceControl={setShowSourceControl}
                            reviewProject={reviewProject}
                            reviewing={reviewing}
                            diagnoseBuild={diagnoseBuild}
                            diagnosingBuild={diagnosingBuild}
                            runBuild={runBuild}
                            runningBuild={runningBuild}
                            runTests={runTests}
                            runningTests={runningTests}
                        />

                        <WorkspaceSourceControl
                            showSourceControl={showSourceControl}
                            gitStatus={gitStatus}
                            loadingGit={loadingGit}
                            loadGitStatus={loadGitStatus}
                            loadGitBranches={loadGitBranches}
                            loadGitHistory={loadGitHistory}
                            showGitBranches={showGitBranches}
                            setShowGitBranches={setShowGitBranches}
                            showGitHistory={showGitHistory}
                            setShowGitHistory={setShowGitHistory}
                            newBranchName={newBranchName}
                            setNewBranchName={setNewBranchName}
                            createGitBranch={createGitBranch}
                            loadingGitBranches={loadingGitBranches}
                            gitBranches={gitBranches}
                            checkoutGitBranch={checkoutGitBranch}
                            gitHistory={gitHistory}
                            loadingGitHistory={loadingGitHistory}
                            gitActionLoading={gitActionLoading}
                            stageGitFile={stageGitFile}
                            unstageGitFile={unstageGitFile}
                            commitMessage={commitMessage}
                            setCommitMessage={setCommitMessage}
                            commitGitChanges={commitGitChanges}
                            pullGitChanges={pullGitChanges}
                            pushGitChanges={pushGitChanges}
                            selectedGitFile={selectedGitFile}
                            setSelectedGitFile={setSelectedGitFile}
                            gitDiff={gitDiff}
                            setGitDiff={setGitDiff}
                            openGitDiff={openGitDiff}
                        />

                        <div className="workspace-ai-content">
                            <WorkspaceAIChat
                                messages={messages}
                                asking={asking}
                                reviewing={reviewing}
                                openSource={openSource}
                                conversations={conversations}
                                activeConversationId={activeConversationId}
                                onNewConversation={createNewConversation}
                                onSelectConversation={setActiveConversationId}
                                onRetryMessage={(retryQuestion, messageIndex, messageId) => {
                                    askAI(
                                        null,
                                        retryQuestion,
                                        messageIndex,
                                        messageId
                                    );
                                }}
                                projectId={projectId}
                                showEmptyState={
                                    !reviewResult &&
                                    !buildResult &&
                                    !testResult &&
                                    !buildDiagnosis &&
                                    !showFix &&
                                    !showGeneration &&
                                    !showMultiFileGeneration &&
                                    !showTestGeneration &&
                                    !showAgentPlan
                                }
                                onEditMessage={editMessage}
                                onDeleteConversation={deleteConversation}
                                onRenameConversation={renameConversation}
                            />

                            <WorkspaceAIResults
                                reviewResult={reviewResult}
                                buildResult={buildResult}
                                buildDiagnosis={buildDiagnosis}
                                testResult={testResult}
                                showFix={showFix}
                                fixResult={fixResult}
                                showDiff={showDiff}
                                selectedCode={selectedCode}
                                selectedFile={selectedFile}
                                getLanguage={getLanguage}
                                applyingFix={applyingFix}
                                rejectFix={rejectFix}
                                applyFix={applyFix}
                                showGeneration={showGeneration}
                                generationResult={generationResult}
                                generationOriginal={generationOriginal}
                                applyingGeneration={applyingGeneration}
                                rejectGeneratedCode={rejectGeneratedCode}
                                applyGeneratedCode={applyGeneratedCode}
                                showMultiFileGeneration={showMultiFileGeneration}
                                multiFileResult={multiFileResult}
                                multiFileIndex={multiFileIndex}
                                setMultiFileIndex={setMultiFileIndex}
                                files={files}
                                fileContent={fileContent}
                                multiFileOriginalContents={multiFileOriginalContents}
                                applyingMultiFile={applyingMultiFile}
                                multiFileReview={multiFileReview}
                                setMultiFileReviewStatus={setMultiFileReviewStatus}
                                rejectMultiFileChanges={rejectMultiFileChanges}
                                applyReviewedMultiFileChanges={applyReviewedMultiFileChanges}
                                showTestGeneration={showTestGeneration}
                                testGenerationResult={testGenerationResult}
                                applyingTests={applyingTests}
                                rejectGeneratedTests={rejectGeneratedTests}
                                acceptGeneratedTests={acceptGeneratedTests}
                                showAgentPlan={showAgentPlan}
                                agentPlan={agentPlan}
                                rejectAgentPlan={rejectAgentPlan}
                                openSource={openSource}
                                executeAgent={executeAgent}
                                executingAgent={executingAgent}
                                agentExecutionResult={agentExecutionResult}
                            />
                        </div>

                        <WorkspaceAIInput
                            selectedCode={selectedCode}
                            asking={asking}
                            explaining={false}
                            fixing={false}
                            question={question}
                            setQuestion={setQuestion}
                            askAI={askAI}
                            explainSelectedCode={explainSelectedCode}
                            fixSelectedCode={fixSelectedCode}
                            generatingCode={generatingCode}
                            generateCodeFromPrompt={generateCodeFromPrompt}
                            generatingMultiFile={generatingMultiFile}
                            generateMultiFileFromPrompt={generateMultiFileFromPrompt}
                            generatingTests={generatingTests}
                            generateTestsFromFile={generateTestsFromFile}
                            planningAgent={planningAgent}
                            generateAgentPlan={generateAgentPlan}
                            aiInputRef={aiInputRef}
                            selectedFile={selectedFile}
                            onCancelEdit={cancelEditMessage}

                        />
                    </aside>
                )}
            </div>

            {error && (
                <div className="workspace-error">
                    {error}
                </div>
            )}

            <WorkspaceCommandPalette
                showCommandPalette={showCommandPalette}
                setShowCommandPalette={setShowCommandPalette}
                commandPaletteQuery={commandPaletteQuery}
                setCommandPaletteQuery={setCommandPaletteQuery}
                filteredCommandPaletteCommands={filteredCommandPaletteCommands}
            />

            <WorkspaceModals
                showSaveConfirm={showSaveConfirm}
                selectedFile={selectedFile}
                savingFile={savingFile}
                cancelSave={cancelSave}
                confirmSave={confirmSave}
                showSwitchConfirm={showSwitchConfirm}
                pendingFile={pendingFile}
                switchingFile={switchingFile}
                cancelFileSwitch={cancelFileSwitch}
                discardAndSwitchFile={discardAndSwitchFile}
                saveAndSwitchFile={saveAndSwitchFile}
            />
        </div>
    );
};

export default Workspace;