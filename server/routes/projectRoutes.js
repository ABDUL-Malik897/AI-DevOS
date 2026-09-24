const express = require("express");
const {
    createProject,
    getProjects,
    cloneProjectRepository,
    scanProject,
    getProjectFiles,
    indexProjectCode,
    searchProjectCode,
    askProjectAI,
    getProject,
    getFileContent,
    explainSelectedCode,
    fixSelectedCode,
    updateFileContent,
    reviewProject,
    analyzeProjectCode,
    runProjectCheck,
    diagnoseProjectBuild,
    getGitStatus,
    getGitDiff,
    commitGitChanges,
    pullGitChanges,
    pushGitChanges,
    streamProjectAI,
    createProjectFolder,
    createProjectFile,
    runProjectTerminal,
    getGitBranches,
    createGitBranch,
    checkoutGitBranch,
    getGitHistory,
    stageGitFile,
    unstageGitFile,
    generateProjectCode,
    generateMultiFileProjectCode,
    generateProjectTests,
    planProjectWithAgent,
    executeProjectWithAgent,
    streamWorkspaceEvents,
    renameProjectFile,
    deleteProjectFile,
    renameProjectFolder,
    deleteProjectFolder,
} = require("../controllers/projectController");
const protect = require("../middleware/authMiddleware");
const { createConversation, getConversations, getConversationMessages, createConversationMessage, searchConversations, editConversationMessage, deleteConversation, renameConversation } = require("../controllers/conversationController");

const router = express.Router();

router.get("/", protect, getProjects);
router.post("/", protect, createProject);
router.post("/:id/clone", protect, cloneProjectRepository);
router.post("/:id/scan", protect, scanProject);
router.get("/:id/files", protect, getProjectFiles);
router.post("/:id/index", protect, indexProjectCode);
router.post("/:id/search", protect, searchProjectCode);
router.post("/:id/ask", protect, askProjectAI);
router.post("/:id/ask/stream", protect, streamProjectAI);
router.get("/:id", protect, getProject);
router.get("/:id/files/:fileId/content", protect, getFileContent);
router.post("/:id/explain", protect, explainSelectedCode);
router.post("/:id/fix", protect, fixSelectedCode);
router.post("/:id/generate", protect, generateProjectCode);
router.post("/:id/generate-multi", protect, generateMultiFileProjectCode);
router.post("/:id/generate-tests", protect, generateProjectTests);
router.put("/:id/files/:fileId/content", protect, updateFileContent);
router.post("/:id/review", protect, reviewProject);
router.post("/:id/analyze", protect,analyzeProjectCode);
router.post("/:id/check", protect, runProjectCheck);
router.post("/:id/terminal", protect, runProjectTerminal);
router.post("/:id/diagnose", protect, diagnoseProjectBuild);
router.get("/:id/git/status", protect, getGitStatus);
router.get("/:id/git/diff", protect, getGitDiff);
router.post("/:id/git/commit", protect, commitGitChanges);
router.post("/:id/git/pull", protect, pullGitChanges);
router.post("/:id/git/push", protect, pushGitChanges);
router.post("/:id/files", protect, createProjectFile);
router.post("/:id/folders", protect, createProjectFolder);
router.get("/:id/git/branches", protect, getGitBranches);
router.post("/:id/git/branches", protect, createGitBranch);
router.post("/:id/git/checkout", protect, checkoutGitBranch);
router.get("/:id/git/history", protect, getGitHistory);
router.post("/:id/git/stage", protect, stageGitFile);
router.post("/:id/git/unstage", protect, unstageGitFile);
router.post("/:id/agent/plan", protect, planProjectWithAgent);
router.post("/:id/agent/execute", protect, executeProjectWithAgent);
router.get("/:id/events", protect, streamWorkspaceEvents);
router.patch("/:id/files/:fileId/rename", protect, renameProjectFile);
router.delete("/:id/files/:fileId", protect, deleteProjectFile);
router.patch("/:id/folders/:fileId/rename", protect, renameProjectFolder);
router.delete("/:id/folders/:fileId", protect, deleteProjectFolder);
router.get("/:id/conversations", protect, getConversations);

router.post("/:id/conversations", protect, createConversation);

router.get(
    "/:id/conversations/:conversationId/messages",
    protect,
    getConversationMessages
);

router.post(
    "/:id/conversations/:conversationId/messages",
    protect,
    createConversationMessage
);

router.get(
    "/:id/conversations/search",
    protect,
    searchConversations
);

router.put(
    "/:id/conversations/:conversationId/messages/:messageId",
    protect,
    editConversationMessage
);

router.delete(
    "/:id/conversations/:conversationId",
    protect,
    deleteConversation
);

router.put(
    "/:id/conversations/:conversationId",
    protect,
    renameConversation
);


module.exports = router;