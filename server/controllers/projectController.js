const path = require("path");
const fs = require("fs/promises");
const simpleGit = require("simple-git");
const { scanProjectFiles } = require("../services/fileScanner");
const Project = require("../models/Project");
const User = require("../models/User");
const File = require("../models/File");
const AgentTask = require("../models/AgentTask");
const { processProjectCode } = require("../services/codeProcessor");
const { generateEmbedding } = require("../services/embeddingService");
const { searchCode } = require("../services/codeSearch");
const { generateCodeAnswer, generateCodeAnswerStream, generateCodeFix, generateCode, generateCodeReview, diagnoseBuildError, generateMultiFileCode, generateTests, generateAgentPlan, diagnoseTestError } = require("../services/aiService");
const CodeChunk = require("../models/CodeChunk");
const { analyzeProject } = require("../services/staticAnalyzer");
const { runProjectCommand, runTerminalCommand } = require("../services/projectRunner");
const { runAgentLoop } = require("../services/agentLoop");
const { formatCodeContext } = require("../services/codeContextFormatter");
const { startWorkspaceWatcher } = require("../services/workspaceWatcher");
const { subscribe, publish } = require("../services/workspaceEventBus");
const Conversation = require("../models/Conversation");
const ConversationMessage = require("../models/ConversationMessage");


const createProject = async (req, res) => {
    try {
        const { name, description, githubRepoId, githubRepoName, githubFullName, githubOwner, githubUrl, defaultBranch, language } = req.body;

        if (!name || !githubRepoId || !githubRepoName || !githubFullName || !githubOwner) {
            return res.status(400).json({
                error: "Required project information is missing"
            });
        }

        const existingProject = await Project.findOne({
            owner: req.user._id,
            githubRepoId: String(githubRepoId)
        });

        if (existingProject) {
            return res.status(400).json({
                error: "This repository is already added"
            });
        }

        const project = await Project.create({
            name,
            description,
            owner: req.user._id,
            githubRepoId: String(githubRepoId),
            githubRepoName,
            githubFullName,
            githubOwner,
            githubUrl,
            defaultBranch,
            language
        });

        res.status(201).json({
            project
        });
    } catch (error) {
        console.error("Create project error:", error.message);
        res.status(500).json({
            error: "Failed to create project"
        });
    }
};

const getProjects = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const perPage = Math.min(30,Math.max(1,Number.parseInt(req.query.per_page, 10) || 12));
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        const query = {
            owner: req.user._id
        };

        if (search) {
            query.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    githubFullName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        const skip = (page - 1) * perPage;
        const totalProjects = await Project.countDocuments(query);
        const projects =  await Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage);
        const totalPages = Math.ceil(totalProjects / perPage);
        res.status(200).json({
            projects,
            pagination: {
                page,
                perPage,
                search,
                totalProjects,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error("Projects fetch error:", error.message);
        res.status(500).json({
            error: "Failed to fetch projects"
        });
    }
};

const cloneProjectRepository = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user || !user.githubAccessToken) {
            return res.status(400).json({
                error: "GitHub is not connected"
            });
        }

        const workspacePath = path.join( __dirname, "../../workspaces", req.user._id.toString(),project._id.toString());
        project.cloneStatus = "cloning";
        await project.save();

        await fs.rm(workspacePath, {
            recursive: true,
            force: true
        });

        await fs.mkdir(path.dirname(workspacePath), {recursive: true});
        const git = simpleGit();
        const githubUrl = `https://x-access-token:${encodeURIComponent(user.githubAccessToken)}@github.com/${project.githubFullName}.git`;
        await git.clone(githubUrl, workspacePath);
        project.workspacePath = workspacePath;
        project.cloneStatus = "cloned";
        await project.save();
        const files = await scanProjectFiles(project.workspacePath, project._id);

        res.status(200).json({
            message: "Repository initialized successfully",
            project: {
                id: project._id,
                name: project.name,
                cloneStatus: project.cloneStatus
            },
            fileCount: files.length
        });
    } catch (error) {
        console.error("Repository clone error:", error.message);
        try {
            await Project.findOneAndUpdate(
                {
                    _id: req.params.id,
                    owner: req.user._id
                },
                {
                    cloneStatus: "failed"
                }
            );
        } catch (updateError) {
            console.error("Failed to update clone status:", updateError.message);
        }
        res.status(500).json({
            error: "Failed to clone repository"
        });
    }
};

const scanProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }
        const files = await scanProjectFiles(project.workspacePath, project._id);
        res.status(200).json({
            message: "Project scanned successfully",
            fileCount: files.length
        });
    } catch (error) {
        console.error("Project scan error:", error.message);
        res.status(500).json({
            error: "Failed to scan project"
        });
    }
};

const getProjectFiles = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        const files = await File.find({project: project._id}).sort({path: 1});
        res.status(200).json({
            files
        });
    } catch (error) {
        console.error("Get project files error:", error.message);
        res.status(500).json({
            error: "Failed to fetch project files"
        });
    }
};

const indexProjectCode = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }
        const result = await processProjectCode(project);
        res.status(200).json({
            message: "Code indexed successfully",
            processedFiles: result.processedFiles,
            chunks: result.totalChunks
        });
    } catch (error) {
        console.error("Code indexing error:", error);

        res.status(500).json({
            error: "Failed to index project code"
        });
    }
};

const searchProjectCode = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({
                error: "Search query is required"
            });
        }
        const queryEmbedding = await generateEmbedding(query);
        const results = await searchCode(project._id, queryEmbedding, 5);
        res.status(200).json({
            results
        });
    } catch (error) {
        console.error("Code search error:", error.message);
        res.status(500).json({
            error: "Failed to search project code"
        });
    }
};

const askProjectAI = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }
        const { question, filePath, selectedCode, currentFileContent, conversation } = req.body;
        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Question is required"
            });
        }

        const cleanQuestion = question.trim();
        const queryEmbedding = await generateEmbedding(cleanQuestion);
        const results = await searchCode(project._id, queryEmbedding, 5)
        const codeContext =  formatCodeContext(results);
        if (filePath && currentFileContent && currentFileContent.trim()) {
            const MAX_FILE_LENGTH = 12000;
            const trimmedFileContent = currentFileContent.length > MAX_FILE_LENGTH ? currentFileContent.slice(0, MAX_FILE_LENGTH) + "\n\n[File truncated]" : currentFileContent;
            codeContext += `-------------------------
                CURRENT OPEN FILE
                FILE: ${filePath}
                ${trimmedFileContent}
            `.trim();
        }
        if (selectedCode && selectedCode.trim()) {
            codeContext += ` -------------------------
                CURRENT USER SELECTION
                FILE: ${filePath || "Unknown file"}
                ${selectedCode.trim()}
                `.trim();
        }

        if (!codeContext.trim()) {
            codeContext = "No relevant project code was found.";
        }

        const safeConversation = Array.isArray(conversation) ? conversation.filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string").slice(-10) : [];
        let conversationContext = "";

        if (safeConversation.length > 0) {
            conversationContext = safeConversation.map((message) => {
                const speaker = message.role === "user" ? "USER" : "ASSISTANT";
                return `${speaker}:\n${message.content}`;
            }).join("\n\n");
        }
        const finalContext = `
            PROJECT CODE CONTEXT
            ====================
            ${codeContext}
            ${conversationContext
            ? `
            CONVERSATION HISTORY
            ====================
            ${conversationContext}
            ` : ""}`.trim();
        const answer = await generateCodeAnswer(cleanQuestion, finalContext);
        const sources = results.map((result) => ({
            filePath: result.filePath,
            startLine: result.startLine,
            endLine: result.endLine
        }));
        return res.status(200).json({
            answer,
            sources
        });
    } catch (error) {
        console.error("Ask project AI error:", error);
        return res.status(500).json({
            error: error.response?.data?.error || error.message || "Failed to ask project AI"
        });
    }
};

const explainSelectedCode = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }
        const {
            code,
            filePath,
            conversationId,
            currentFileContent
        } = req.body;
        if (!code || !code.trim()) {
            return res.status(400).json({
                error: "Code is required"
            });
        }

        let codeContext = `
            File: ${filePath || "Unknown"}
            Selected Code: ${code}
        `;
        if (conversationId) {
            const conversationRecord = await Conversation.findOne({
                _id: conversationId,
                project: project._id,
                owner: req.user._id
            });

            if (!conversationRecord) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            const conversationMessages =
                await ConversationMessage.find({
                    conversation: conversationRecord._id,
                    role: {
                        $in: ["user", "assistant"]
                    }
                })
                    .sort({ createdAt: 1 })
                    .lean();

            const recentMessages = conversationMessages.slice(-10);

            if (recentMessages.length > 0) {
                const conversationContext = recentMessages
                    .map((message) => {
                        const speaker =
                            message.role === "user"
                                ? "USER"
                                : "ASSISTANT";

                        return `${speaker}:\n${message.content}`;
                    })
                    .join("\n\n");

                codeContext += `
                    -------------------------
                    CONVERSATION HISTORY
                    ======================
                    ${conversationContext}
                `.trim();
            }
        }

        if (
            currentFileContent &&
            currentFileContent.trim()
        ) {
            const MAX_FILE_LENGTH = 12000;

            const trimmedFileContent =
                currentFileContent.length > MAX_FILE_LENGTH
                    ? currentFileContent.slice(0, MAX_FILE_LENGTH) +
                    "\n\n[File truncated]"
                    : currentFileContent;

            codeContext += `
                -------------------------
                CURRENT OPEN FILE
                FILE: ${filePath || "Unknown file"}
                ${trimmedFileContent}
            `.trim();
        }
        const answer = await generateCodeAnswer("Explain the selected code clearly. Explain what it does, how it works, and any important details a developer should know.", codeContext);
        res.status(200).json({
            answer
        });

    } catch (error) {
        console.error("Explain code error:", error.message);
        res.status(500).json({
            error: "Failed to explain code"
        });
    }
};

const fixSelectedCode = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }
        const {
            code,
            filePath,
            conversationId,
            currentFileContent
        } = req.body;
        if (!code || !code.trim()) {
            return res.status(400).json({
                error: "Code is required"
            });
        }
        let conversationContext = "";

        if (conversationId) {
            const conversationRecord = await Conversation.findOne({
                _id: conversationId,
                project: project._id,
                owner: req.user._id
            });

            if (!conversationRecord) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            const conversationMessages =
                await ConversationMessage.find({
                    conversation: conversationRecord._id,
                    role: {
                        $in: ["user", "assistant"]
                    }
                })
                    .sort({ createdAt: 1 })
                    .lean();

            const recentMessages =
                conversationMessages.slice(-10);

            if (recentMessages.length > 0) {
                conversationContext = recentMessages
                    .map((message) => {
                        const speaker =
                            message.role === "user"
                                ? "USER"
                                : "ASSISTANT";

                        return `${speaker}:\n${message.content}`;
                    })
                    .join("\n\n");
            }
        }

        if (
            currentFileContent &&
            currentFileContent.trim()
        ) {
            const MAX_FILE_LENGTH = 12000;

            const trimmedFileContent =
                currentFileContent.length > MAX_FILE_LENGTH
                    ? currentFileContent.slice(0, MAX_FILE_LENGTH) +
                    "\n\n[File truncated]"
                    : currentFileContent;

            conversationContext += `
                CURRENT OPEN FILE
                FILE: ${filePath || "Unknown file"}
                ${trimmedFileContent}
            `.trim();
        }

        const result = await generateCodeFix(
            code,
            filePath,
            conversationContext
        );
        res.status(200).json(result);
    } catch (error) {
        console.error("Fix code error:",error.message);

        res.status(500).json({
            error: "Failed to fix code"
        });
    }
};

const generateProjectCode = async (req,res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const {instruction, filePath, currentFileContent, selectedCode} = req.body;
        if (typeof instruction !== "string" || !instruction.trim()) {
            return res.status(400).json({
                error: "Generation instruction is required"
            });
        }

        const cleanInstruction = instruction.trim();
        let codeContext = "";

        try {
            const queryEmbedding = await generateEmbedding(cleanInstruction);
            const results = await searchCode(project._id, queryEmbedding, 5);
            codeContext = formatCodeContext(results);
        } catch (searchError) {
            console.error("Generation RAG search failed:", searchError.message);
        }

        if (filePath &&  currentFileContent && currentFileContent.trim()) {
            const MAX_FILE_LENGTH = 6000;
            const trimmedFileContent = currentFileContent.length > MAX_FILE_LENGTH ? currentFileContent.slice(0, MAX_FILE_LENGTH) + "\n\n[File truncated]" : currentFileContent;
            codeContext += `
                -------------------------
                CURRENT OPEN FILE
                FILE: ${filePath}
                ${trimmedFileContent}
                `.trim();
        }

        const safeSelectedCode = typeof selectedCode === "string" ? selectedCode.trim() : "";
        if (!codeContext.trim()) {
            codeContext = "No additional project code context was found.";
        }
        const result = await generateCode(cleanInstruction, filePath, codeContext, safeSelectedCode);
        return res.status(200).json({
            explanation: result.explanation,
            operation: result.operation,
            location: result.location || null,
            code: result.code
        });

    } catch (error) {
        console.error("Generate project code error:", error);

        return res.status(500).json({
            error: error.message || "Failed to generate code"
        });
    }
};

const getProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        res.status(200).json({
            project
        });
    } catch (error) {
        console.error("Get project error:", error.message);
        res.status(500).json({
            error: "Failed to fetch project"
        });
    }
};

const getFileContent = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        const file = await File.findOne({
            _id: req.params.fileId,
            project: project._id,
            type: "file"
        });

        if (!file) {
            return res.status(404).json({
                error: "File not found"
            });
        }
        const absolutePath = path.join(project.workspacePath, file.path);
        const content = await fs.readFile(absolutePath, "utf8");
        res.status(200).json({
            content
        });
    } catch (error) {
        console.error("Get file content error:", error.message);
        res.status(500).json({
            error: "Failed to read file"
        });
    }
};

const updateFileContent = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        const file = await File.findOne({
            _id: req.params.fileId,
            project: project._id,
            type: "file"
        });

        if (!file) {
            return res.status(404).json({
                error: "File not found"
            });
        }

        const { content } = req.body;
        if (typeof content !== "string") {
            return res.status(400).json({
                error: "File content is required"
            });
        }

        const workspacePath = path.resolve(project.workspacePath);
        const filePath = path.resolve(workspacePath, file.path);

        if (filePath !== workspacePath && !filePath.startsWith(workspacePath + path.sep)) {
            return res.status(400).json({
                error: "Invalid file path"
            });
        }
        await fs.writeFile(filePath,content, "utf8");
        res.status(200).json({
            message: "File saved successfully",
            filePath: file.path
        });
    } catch (error) {
        console.error("Update file error:", error.message);
        res.status(500).json({
            error: "Failed to save file"
        });
    }
};

const createProjectFile = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const { filePath, content = "" } = req.body;

        if (typeof filePath !== "string" || !filePath.trim()) {
            return res.status(400).json({
                error: "File path is required"
            });
        }

        const normalizedPath = filePath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
        if (!normalizedPath) {
            return res.status(400).json({
                error: "Invalid file path"
            });
        }

        const workspacePath = path.resolve(project.workspacePath);
        const absoluteFilePath = path.resolve(workspacePath, normalizedPath);
        if (absoluteFilePath === workspacePath || !absoluteFilePath.startsWith(workspacePath + path.sep)) {
            return res.status(400).json({
                error: "Invalid file path"
            });
        }

        const existingFile = await File.findOne({
            project: project._id,
            path: normalizedPath
        });

        if (existingFile) {
            return res.status(409).json({
                error: "A file or folder with this path already exists"
            });
        }

        await fs.mkdir(path.dirname(absoluteFilePath), {
            recursive: true
        });
        await fs.writeFile(absoluteFilePath, content, "utf8");
        const file = await File.create({
            project: project._id,
            path: normalizedPath,
            name: path.basename(normalizedPath),
            extension: path.extname(normalizedPath),
            size: Buffer.byteLength(content, "utf8"),
            type: "file"
        });

        return res.status(201).json({
            message: "File created successfully",
            file
        });
    } catch (error) {
        console.error("Create project file error:", error.message);
        return res.status(500).json({
            error: "Failed to create file"
        });
    }
};

const createProjectFolder = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }
        const { folderPath } = req.body;
        if (typeof folderPath !== "string" || !folderPath.trim()) {
            return res.status(400).json({
                error: "Folder path is required"
            });
        }
        const normalizedPath = folderPath.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
        if (!normalizedPath) {
            return res.status(400).json({
                error: "Invalid folder path"
            });
        }

        const workspacePath = path.resolve(project.workspacePath);
        const absoluteFolderPath = path.resolve(workspacePath, normalizedPath);
        if (absoluteFolderPath === workspacePath || !absoluteFolderPath.startsWith(workspacePath + path.sep)) {
            return res.status(400).json({
                error: "Invalid folder path"
            });
        }

        const existingFile = await File.findOne({
            project: project._id,
            path: normalizedPath
        });

        if (existingFile) {
            return res.status(409).json({
                error: "A file or folder with this path already exists"
            });
        }

        await fs.mkdir(absoluteFolderPath,{
            recursive: true
        });

        const folder = await File.create({
            project: project._id,
            path: normalizedPath,
            name: path.basename(normalizedPath),
            extension: "",
            size: 0,
            type: "directory"
        });

        return res.status(201).json({
            message: "Folder created successfully",
            folder
        });
    } catch (error) {
        console.error("Create project folder error:",error.message);
        return res.status(500).json({
            error: "Failed to create folder"
        });
    }
};

const dedupeFindings = (findings) => {
    const seen = new Set();
    return findings.filter((finding) => {
        const normalizedFile = finding.file ?.replace(/\\/g, "/").toLowerCase();
        const normalizedMessage = finding.message?.trim().toLowerCase();
        const key = [normalizedFile, finding.line, normalizedMessage].join("|");
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

const reviewProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const start = Date.now();
        let relevantChunks = await CodeChunk.find({
            project: project._id
        }).sort({
            filePath: 1,
            startLine: 1
        }).limit(30);
        console.log("Review chunks retrieved:", relevantChunks.length);
        if (!relevantChunks.length) {
            console.log("No indexed code found. Indexing project before review...");

            try {
                const indexResult = await processProjectCode(project);
                console.log("Automatic indexing completed:", indexResult);
            } catch (indexError) {
                console.error("Automatic indexing failed:", indexError);
                return res.status(500).json({
                    error: "Project indexing failed before review"
                });
            }
            relevantChunks = await CodeChunk.find({
                project: project._id
            }).sort({
                filePath: 1,
                startLine: 1
            }).limit(30);
            console.log("Review chunks after indexing:", relevantChunks.length);
        }

        if (!relevantChunks.length) {
            return res.status(400).json({
                error: "No code could be indexed for this project"
            });
        }

        const codeContext = relevantChunks.map((chunk) => {
            return `
                FILE: ${chunk.filePath}
                LINES: ${chunk.startLine}-${chunk.endLine}
                CODE:
                ${chunk.content}
            `;
        }).join("\n\n");

        const analysis = await analyzeProject(project.workspacePath);
        console.log("Static analysis:", analysis);
        const aiStart = Date.now();
        const review = await generateCodeReview(codeContext, analysis);
        console.log("AI generation:", Date.now() - aiStart, "ms");
        console.log("TOTAL REVIEW:", Date.now() - start, "ms");
        const combinedReview = {
            summary: review.summary,
            critical: dedupeFindings([
                ...analysis.critical,
                ...review.critical
            ]),

            warnings: dedupeFindings([
                ...analysis.warnings,
                ...review.warnings
            ]),

            improvements: dedupeFindings([
                ...analysis.improvements,
                ...review.improvements
            ])
        };

        res.status(200).json({
            review: combinedReview,
            metadata: {
                chunksAnalyzed: relevantChunks.length,
                staticAnalysis: {
                    critical: analysis.critical.length,
                    warnings: analysis.warnings.length,
                    improvements: analysis.improvements.length
                }
            }
        });
    } catch (error) {
        console.error("Project review error:", error);
        res.status(500).json({
            error: "Failed to review project"
        });
    }
};

const analyzeProjectCode = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const analysis = await analyzeProject(project.workspacePath);
        res.status(200).json({
            analysis
        });
    } catch (error) {
        console.error("Static analysis error:", error);
        res.status(500).json({
            error: "Failed to analyze project"
        });
    }
};

const runProjectCheck = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const command = req.body.command || "build";
        const result = await runProjectCommand(project.workspacePath, command);
        res.status(200).json({
            result
        });
    } catch (error) {
        console.error("Project check error:", error);
        res.status(500).json({
            error:"Failed to run project check"
        });
    }
};

const runProjectTerminal = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const { command } = req.body;
        if (typeof command !== "string" || !command.trim()) {
            return res.status(400).json({
                error: "Terminal command is required"
            });
        }
        const result = await runTerminalCommand(project.workspacePath, command);
        return res.status(200).json({
            result
        });
    } catch (error) {
        console.error("Project terminal error:", error);
        return res.status(500).json({
            error: error.message || "Failed to run terminal command"
        });
    }
};

const diagnoseProjectBuild = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const command = req.body?.command === "test" ? "test" : "build";
        const checkResult = await runProjectCommand(project.workspacePath, command);
        if (checkResult.success) {
            return res.status(200).json({
                diagnosis: {
                    summary: "The project build is passing.",
                    file: null,
                    line: null,
                    message: "No build error was found.",
                    suggestion: null
                }
            });
        }

        const checkOutput = [
            checkResult.stdout,
            checkResult.stderr
        ].filter(Boolean).join("\n");

        let filePath = null;
        let line = null;
        let projectCode = "";

        if (command === "test") {
            const testFile = await File.findOne({
                project: project._id,
                type: "file",
                path: "test.js"
            });

            if (!testFile) {
                throw new Error("Test file not found");
            }

            const testFilePath = path.resolve(
                project.workspacePath,
                testFile.path
            );

            const testSource = await fs.readFile(
                testFilePath,
                "utf8"
            );

            // Find the test line reported by Node.js.
            const lineMatch = checkOutput.match(
                /test\.js:(\d+)/
            );

            const failedLineNumber = lineMatch
                ? Number(lineMatch[1])
                : null;

            let failedTestLine = "";

            if (failedLineNumber) {
                const testLines = testSource.split(/\r?\n/);

                failedTestLine =
                    testLines[failedLineNumber - 1] || "";
            }

            // Extract the function being tested from assertions such as:
            // assert.strictEqual(square(5), 25);
            const functionMatch = failedTestLine.match(
                /(?:strictEqual|deepStrictEqual|equal)\s*\(\s*([A-Za-z_$][\w$]*)\s*\(/
            );

            const functionName = functionMatch
                ? functionMatch[1]
                : null;

            if (!functionName) {
                throw new Error(
                    "Could not determine the function involved in the failed test"
                );
            }

            const projectFiles = await File.find({
                project: project._id,
                type: "file"
            }).sort({
                path: 1
            });

            let matchedSourceFile = null;
            let matchedSourceCode = "";

            for (const projectFile of projectFiles) {
                const normalizedPath = projectFile.path
                    .replace(/\\/g, "/");

                if (
                    normalizedPath === "test.js" ||
                    normalizedPath.endsWith(".test.js") ||
                    normalizedPath.endsWith(".spec.js")
                ) {
                    continue;
                }

                try {
                    const absolutePath = path.resolve(
                        project.workspacePath,
                        normalizedPath
                    );

                    const workspacePath = path.resolve(
                        project.workspacePath
                    );

                    if (
                        absolutePath === workspacePath ||
                        !absolutePath.startsWith(workspacePath + path.sep)
                    ) {
                        continue;
                    }

                    const content = await fs.readFile(
                        absolutePath,
                        "utf8"
                    );

                    const functionDefinitionPattern = new RegExp(
                        `\\bfunction\\s+${functionName}\\s*\\(`
                    );

                    if (functionDefinitionPattern.test(content)) {
                        matchedSourceFile = normalizedPath;
                        matchedSourceCode = content;
                        break;
                    }
                } catch (fileError) {
                    console.error(
                        `Failed to inspect ${normalizedPath}:`,
                        fileError.message
                    );
                }
            }

            if (!matchedSourceFile) {
                throw new Error(
                    `Could not locate source implementation for ${functionName}`
                );
            }

            filePath = matchedSourceFile;

            projectCode = `
        TEST ASSERTION:
        ${failedTestLine}

        SOURCE FILE:
        ${matchedSourceFile}

        SOURCE CODE:
        ${matchedSourceCode}
            `.trim();
        } else {
            const fileMatch = checkOutput.match(
                /(?:\[\s*)?([^\s\[\]]+\.(?:js|jsx|ts|tsx|vue|svelte|css|scss|html)):(\d+):(\d+)/
            );

            if (fileMatch) {
                filePath = fileMatch[1].replace(/\\/g, "/");
                line = Number(fileMatch[2]);

                const workspacePath = path.resolve(
                    project.workspacePath
                );

                const absoluteFilePath = path.isAbsolute(filePath)
                    ? filePath
                    : path.resolve(workspacePath, filePath);

                if (
                    absoluteFilePath !== workspacePath &&
                    absoluteFilePath.startsWith(workspacePath + path.sep)
                ) {
                    try {
                        projectCode = await fs.readFile(
                            absoluteFilePath,
                            "utf8"
                        );
                    } catch (fileError) {
                        console.error(
                            "Failed to read diagnostic file:",
                            fileError.message
                        );
                    }
                }
            }
        }

        const diagnosis = command === "test"
        ? await diagnoseTestError(checkOutput, projectCode)
        : await diagnoseBuildError(checkOutput, projectCode);
        const finalDiagnosis = {
            ...diagnosis,
            file: filePath || diagnosis.file || null,
            line: line || diagnosis.line || null
        };

        res.status(200).json({
            diagnosis: finalDiagnosis,
            metadata: {
                buildSuccess: checkResult.success,
                checkOutputLength: checkOutput.length,
                sourceLoaded: Boolean(projectCode)
            }
        });
    } catch (error) {
        console.error("Build diagnosis error:", error);
        res.status(500).json({
            error:"Failed to diagnose build"
        });
    }
};

const getProjectGit = async (req) => {
    const project = await Project.findOne({
        _id: req.params.id,
        owner: req.user._id
    });

    if (!project) {
        const error = new Error("Project not found");
        error.statusCode = 404;
        throw error;
    }

    if (project.cloneStatus !== "cloned" || !project.workspacePath) {
        const error = new Error("Project repository is not cloned");
        error.statusCode = 400;
        throw error;
    }

    const git = simpleGit(project.workspacePath);
    return {
        project,
        git
    };
};

const validateGitFilePath = (project, filePath) => {
    if (typeof filePath !== "string" || !filePath.trim()) {
        const error = new Error("File path is required");
        error.statusCode = 400;
        throw error;
    }
    const workspacePath = path.resolve(project.workspacePath);
    const absoluteFilePath = path.resolve(workspacePath,filePath);
    if (absoluteFilePath === workspacePath || !absoluteFilePath.startsWith(workspacePath + path.sep)) {
        const error = new Error("Invalid file path");
        error.statusCode = 400;
        throw error;
    }
    return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
};

const validateGitBranchName = async (git,branchName) => {
    if (typeof branchName !== "string" || !branchName.trim()) {
        const error = new Error("Branch name is required");
        error.statusCode = 400;
        throw error;
    }
    const cleanName = branchName.trim();
    await git.raw(["check-ref-format", "--branch", cleanName]);
    return cleanName;
};

const getGitStatus = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const status = await git.status();
        const files = status.files.map((file) => {
            const staged = file.index && file.index !== " ";
            const unstaged = file.working_dir && file.working_dir !== " ";
            let statusLabel = "untracked";

            if (file.index === "A" || file.working_dir === "A") {
                statusLabel = "added";
            } else if (file.index === "D" || file.working_dir === "D") {
                statusLabel = "deleted";
            } else if (file.index === "R" || file.working_dir === "R") {
                statusLabel = "renamed";
            } else if (file.index === "M" || file.working_dir === "M") {
                statusLabel = "modified";
            }
            return {
                path: file.path,
                status: statusLabel,
                staged: Boolean(staged),
                unstaged: Boolean(unstaged),
                index: file.index || " ",
                workingDir: file.working_dir || " "
            };
        });

        return res.status(200).json({
            branch: status.current,
            ahead: status.ahead,
            behind: status.behind,
            tracking: status.tracking,
            files
        });

    } catch (error) {
        console.error("Git status error:", error.message);
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to get Git status"
        });
    }
};

const getGitDiff = async (req, res) => {
    try {
        const { project } = await getProjectGit(req);
        const filePath = validateGitFilePath(project, req.query.file);
        const staged = req.query.staged === "true";
        const git = simpleGit(project.workspacePath);

        const diff = staged
            ? await git.diff([
                "--cached",
                "--",
                filePath
            ])
            : await git.diff([
                "--",
                filePath
            ]);

        return res.status(200).json({
            file: filePath,
            staged,
            diff
        });
    } catch (error) {
        console.error("Git diff error:", error.message);
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to get Git diff"
        });
    }
};

const commitGitChanges = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Commit message is required"
            });
        }

        const status = await git.status();
        if (!status.staged || status.staged.length === 0) {
            return res.status(400).json({
                error: "No staged changes to commit"
            });
        }
        const commit = await git.commit(message.trim());

        return res.status(200).json({
            message: "Changes committed successfully",
            commit: {
                hash: commit.commit,
                summary: commit.summary,
                branch: commit.branch
            }
        });

    } catch (error) {
        console.error("Git commit error:", error.message);
        return res.status(500).json({
            error: error.message || "Failed to commit changes"
        });
    }
};

const pullGitChanges = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const status = await git.status();

        if (status.files.length > 0) {
            return res.status(400).json({
                error: "You have uncommitted local changes. Commit or discard them before pulling."
            });
        }

        const result = await git.pull();

        return res.status(200).json({
            message: "Changes pulled successfully",
            result: {
                summary: result.summary,
                files: result.files
            }
        });
    } catch (error) {
        console.error("Git pull error:", error.message);
        return res.status(500).json({
            error: error.message || "Failed to pull changes"
        });
    }
};

const pushGitChanges = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const status = await git.status();

        if (!status.current) {
            return res.status(400).json({
                error: "No current Git branch found"
            });
        }

        const branchName = status.current;
        let result;

        if (status.tracking) {
            result = await git.push();
        } else {
            result = await git.push([
                "--set-upstream",
                "origin",
                branchName
            ]);
        }

        return res.status(200).json({
            message: "Changes pushed successfully",
            result: {
                pushed: result.pushed,
                repo: result.repo,
                branch: branchName,
                trackingEstablished: !status.tracking
            }
        });
    } catch (error) {
        console.error("Git push error:", error.message);

        return res.status(500).json({
            error:
                error.message ||
                "Failed to push changes"
        });
    }
};

const getGitBranches = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const result = await git.branchLocal();

        const branches = result.all.map((name) => ({
            name,
            current: name === result.current
        }));

        return res.status(200).json({
            current: result.current,
            branches
        });
    } catch (error) {
        console.error("Git branches error:", error.message);
        return res.status(500).json({
            error: error.message || "Failed to get Git branches"
        });
    }
};

const createGitBranch = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const branchName = await validateGitBranchName(git, req.body.name);
        const result = await git.checkoutLocalBranch(branchName);

        return res.status(201).json({
            message: "Branch created successfully",
            branch: {
                name: branchName,
                current: true
            },
            result
        });
    } catch (error) {
        console.error("Create Git branch error:", error.message);
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to create Git branch"
        });
    }
};

const checkoutGitBranch = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);
        const branchName = await validateGitBranchName(git, req.body.name);
        const branches = await git.branchLocal();

        if (!branches.all.includes(branchName)) {
            return res.status(404).json({
                error: "Local branch not found"
            }) 
        }

        await git.checkout(branchName);

        return res.status(200).json({
            message: "Branch switched successfully",
            branch: branchName
        });
    } catch (error) {
        console.error("Checkout Git branch error:", error.message);
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to switch branch"
        });
    }
};

const getGitHistory = async (req, res) => {
    try {
        const { git } = await getProjectGit(req);

        const result = await git.log({
            maxCount: 50
        });

        const commits = result.all.map((commit) => ({
            hash: commit.hash,
            abbreviatedHash: commit.hash.slice(0, 7),
            message: commit.message,
            date: commit.date,
            author: commit.author_name || "Unknown"
        }));

        return res.status(200).json({
            commits
        });
    } catch (error) {
        console.error("Git history error:",error.message);
        return res.status(500).json({
            error: error.message || "Failed to get Git history"
        });
    }
};

const stageGitFile = async (req, res) => {
    try {
        const { project, git } = await getProjectGit(req);
        const filePath = validateGitFilePath(project, req.body.file);
        await git.add([filePath]);
        return res.status(200).json({
            message: "File staged successfully",
            file: filePath
        });
    } catch (error) {
        console.error("Stage Git file error:", error.message);
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to stage file"
        });
    }
};

const unstageGitFile = async (req, res) => {
    try {
        const { project, git } = await getProjectGit(req);

        const filePath = validateGitFilePath(project,req.body.file);
        await git.reset(["--",filePath]);

        return res.status(200).json({
            message: "File unstaged successfully",
            file: filePath
        });
    } catch (error) {
        console.error("Unstage Git file error:",error.message);
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to unstage file"
        });
    }
};

const streamProjectAI = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        const {
            question,
            filePath,
            selectedCode,
            currentFileContent,
            conversationId
        } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Question is required"
            });
        }

        const cleanQuestion = question.trim();
        const queryEmbedding = await generateEmbedding(cleanQuestion);
        const results = await searchCode(project._id, queryEmbedding, 5);
        let codeContext = formatCodeContext(results);

        if (filePath && currentFileContent && currentFileContent.trim()) {
            const MAX_FILE_LENGTH = 12000;
            const trimmedFileContent = currentFileContent.length > MAX_FILE_LENGTH ? currentFileContent.slice(0,MAX_FILE_LENGTH) + "\n\n[File truncated]" : currentFileContent;
            codeContext += `
                -------------------------
                CURRENT OPEN FILE
                FILE: ${filePath}
                ${trimmedFileContent}
            `.trim();
        }

        if (selectedCode && selectedCode.trim()) {
            codeContext += `
                -------------------------
                CURRENT USER SELECTION
                FILE: ${filePath || "Unknown file"}
                ${selectedCode.trim()}
            `.trim();
        }

        if (conversationId) {
            const conversationRecord = await Conversation.findOne({
                _id: conversationId,
                project: project._id,
                owner: req.user._id
            });

            if (!conversationRecord) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            const conversationMessages =
                await ConversationMessage.find({
                    conversation: conversationRecord._id,
                    role: {
                        $in: ["user", "assistant"]
                    }
                })
                    .sort({ createdAt: 1 })
                    .lean();

            const recentMessages = conversationMessages.slice(-10);

            if (recentMessages.length > 0) {
                const conversationContext = recentMessages
                    .map((message) => {
                        const speaker =
                            message.role === "user"
                                ? "USER"
                                : "ASSISTANT";

                        return `${speaker}:\n${message.content}`;
                    })
                    .join("\n\n");

                codeContext += `
                    -------------------------
                    CONVERSATION HISTORY
                    ${conversationContext}
                `.trim();
            }
        }
        if (!codeContext.trim()) {
            codeContext = "No relevant project code was found.";
        }

        const sources = results.map((result) => ({
            filePath: result.filePath,
            startLine: result.startLine,
            endLine: result.endLine
        }));

        res.status(200);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control","no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering","no");

        if (res.flushHeaders) {
            res.flushHeaders();
        }
        res.write(`data: ${JSON.stringify({
            type: "sources",
            sources
        })}\n\n`);

        await generateCodeAnswerStream(cleanQuestion, codeContext, async (token) => {
            res.write(`data: ${JSON.stringify({
                type: "token",
                content: token
            })}\n\n`);
        });
        res.write(`data: ${JSON.stringify({
            type: "done"
        })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Stream project AI error:", error);
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({
                type: "error",
                error: error.message || "Failed to stream AI response"
                })}\n\n`
            );
            res.end();
            return;
        }
        return res.status(500).json({
            error: error.message || "Failed to stream AI response"
        });
    }
};

const generateMultiFileProjectCode = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const {instruction, currentFilePath,currentFileContent } = req.body;
        if (typeof instruction !== "string" || !instruction.trim()) {
            return res.status(400).json({
                error: "Multi-file instruction is required"
            });
        }

        const cleanInstruction = instruction.trim();
        let relevantPaths = [];

        try {
            const queryEmbedding = await generateEmbedding(cleanInstruction);
            const results = await searchCode(project._id, queryEmbedding, 8);
            relevantPaths = results.map((result) => result.filePath?.replace(/\\/g, "/"));
        } catch (searchError) {
            console.error("Multi-file RAG search failed:", searchError.message);
        }
        relevantPaths = [...new Set(relevantPaths.filter(Boolean))];
        if (currentFilePath) {
            const normalizedCurrentPath = currentFilePath.replace(/\\/g, "/");
            relevantPaths = [
                normalizedCurrentPath,
                ...relevantPaths
            ];
        }

        const projectFiles = await File.find({
            project: project._id,
            type: "file"
        }).sort({
            path: 1
        });

        const fileMap = new Map();

        projectFiles.forEach((file) => {
            fileMap.set(file.path.replace(/\\/g, "/"), file);
        });

        const preferredFiles = [
            "package.json",
            "README.md"
        ];

        preferredFiles.forEach((filePath) => {
            if (fileMap.has(filePath) && !relevantPaths.includes(filePath)) {
                relevantPaths.push(filePath);
            }
        });

        relevantPaths = relevantPaths.slice(0, 8);
        const contextParts = [];

        for (const filePath of relevantPaths) {
            const fileRecord = fileMap.get(filePath);
            if (!fileRecord) {
                continue;
            }

            try {
                let content;

                if (currentFilePath && filePath === currentFilePath.replace(/\\/g, "/") && typeof currentFileContent === "string") {
                    content = currentFileContent;
                } else {
                    const absolutePath = path.resolve(project.workspacePath, fileRecord.path);
                    const workspacePath = path.resolve(project.workspacePath);
                    if (!absolutePath.startsWith(workspacePath + path.sep)) {
                        continue;
                    }
                    content = await fs.readFile(absolutePath, "utf8");
                }

                const MAX_FILE_LENGTH = 7000;
                if (content.length > MAX_FILE_LENGTH) {
                    content = content.slice(0, MAX_FILE_LENGTH) + "\n\n[File truncated]";
                }
                contextParts.push(`
                    FILE: ${filePath}
                    ${content}
                `.trim());
            } catch (fileError) {
                console.error(`Failed to read ${filePath}:`, fileError.message);
            }
        }

        const projectContext = contextParts.join("\n\n========================================\n\n");
        if (!projectContext.trim()) {
            return res.status(400).json({
                error: "No project files were available for analysis"
            });
        }

        const result = await generateMultiFileCode(cleanInstruction, projectContext);
        const workspacePath = path.resolve(project.workspacePath);
        const validatedChanges = result.changes.filter((change) => {
            const normalizedPath = change.filePath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
            if (!normalizedPath) {
                return false;
            }
            if (normalizedPath.includes("node_modules/") || normalizedPath === "package-lock.json" ||
            normalizedPath.startsWith(".git/") || normalizedPath === ".env") {
                return false;
            }
                const absolutePath = path.resolve(workspacePath, normalizedPath);
                if (!absolutePath.startsWith(workspacePath + path.sep)) {
                    return false;
                }
                change.filePath = normalizedPath;
                return true;
        });

        if (validatedChanges.length === 0) {
            return res.status(400).json({
                error: "AI did not produce any valid project file changes"
            });
        }

        return res.status(200).json({
            summary: result.summary,
            changes: validatedChanges
        });
    } catch (error) {
        console.error("Generate multi-file project code error:", error);
        return res.status(500).json({
            error: error.message || "Failed to generate multi-file changes"
        });
    }
};

const generateProjectTests = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error:"Project repository is not cloned"
            });
        }

        const {filePath,sourceCode} = req.body;

        if (typeof filePath !== "string" || !filePath.trim()) {
            return res.status(400).json({
                error: "Source file path is required"
            });
        }

        if (typeof sourceCode !== "string" || !sourceCode.trim()) {
            return res.status(400).json({
                error: "Source code is required"
            });
        }

        const normalizedFilePath = filePath.replace(/\\/g, "/").replace(/^\/+/, "").trim();

        const sourceFile = await File.findOne({
            project: project._id,
            type: "file",
            path: normalizedFilePath
        });

        if (!sourceFile) {
            return res.status(404).json({
                error: "Source file was not found in this project"
            });
        }
        let relevantPaths = [];

        try {
            const queryEmbedding = await generateEmbedding(`Generate tests for ${normalizedFilePath}`);
            const results = await searchCode(project._id, queryEmbedding, 6);
            relevantPaths = results.map((result) => result.filePath?.replace(/\\/g, "/")).filter(Boolean);
        } catch (searchError) {
            console.error("Test generation RAG search failed:", searchError.message);
        }

        relevantPaths = [
            normalizedFilePath,
            ...new Set(relevantPaths)
        ];

        const projectFiles = await File.find({
            project: project._id,
            type: "file"
        });

        const fileMap = new Map();

        projectFiles.forEach((file) => {
            fileMap.set(file.path.replace(/\\/g, "/"), file);
        });

        const contextParts = [];
        const MAX_FILE_LENGTH = 5000;

        for (const projectFilePath of relevantPaths.slice(0, 7)) {
            const projectFile = fileMap.get(projectFilePath);
            if (!projectFile) {
                continue;
            }

            try {
                const absolutePath = path.resolve(project.workspacePath, projectFile.path);
                const workspacePath = path.resolve(project.workspacePath);
                if (absolutePath !== workspacePath && !absolutePath.startsWith(workspacePath + path.sep)) {
                    continue;
                }

                const content = projectFilePath === normalizedFilePath ? sourceCode : await fs.readFile(absolutePath, "utf8");
                const trimmedContent =  content.length > MAX_FILE_LENGTH ? content.slice(0, MAX_FILE_LENGTH) + "\n\n[File truncated]" : content;
                contextParts.push(`
                    FILE: ${projectFilePath}
                    ${trimmedContent}
                `.trim());
            } catch (fileError) {
                console.error(`Failed to read ${projectFilePath}:`, fileError.message);
            }
        }

        const packageJsonFile = fileMap.get("package.json");

        if (packageJsonFile && !relevantPaths.includes("package.json")) {
            try {
                const packageJsonPath = path.resolve(project.workspacePath, packageJsonFile.path);
                const packageJson = await fs.readFile(packageJsonPath, "utf8");
                contextParts.push(`
                    FILE: package.json
                    ${packageJson.slice(0, 5000)}
                `.trim());
            } catch (error) {
                console.error("Failed to read package.json:", error.message);
            }
        }

        const projectContext = contextParts.join("\n\n========================================\n\n");
        const result = await generateTests(normalizedFilePath, sourceCode, projectContext);
        const workspacePath = path.resolve(project.workspacePath);
        const generatedTestPath = result.testFilePath.replace(/\\/g, "/").replace(/^\/+/, "").trim();

        if (!generatedTestPath || generatedTestPath.includes("node_modules/") ||
            generatedTestPath.startsWith(".git/") ||
            generatedTestPath ==="package-lock.json" ||
            generatedTestPath === ".env"
        ) {
            return res.status(400).json({
                error: "AI generated an invalid test file path"
            });
        }

        const generatedAbsolutePath = path.resolve(workspacePath, generatedTestPath);

        if (generatedAbsolutePath !== workspacePath && !generatedAbsolutePath.startsWith(workspacePath + path.sep)) {
            return res.status(400).json({
                error: "Generated test path is outside the project workspace"
            });
        }

        return res.status(200).json({
            testFilePath: generatedTestPath,
            framework: result.framework,
            explanation: result.explanation,
            code: result.code
        });

    } catch (error) {
        console.error("Generate project tests error:", error);
        return res.status(500).json({
            error: error.message || "Failed to generate tests"
        });
    }
};

const planProjectWithAgent = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const {instruction} = req.body;

        if (typeof instruction !== "string" || !instruction.trim()) {
            return res.status(400).json({
                error:"Agent instruction is required"
            });
        }

        const cleanInstruction = instruction.trim();
        const dangerousInstructionPattern = /\b(delete|destroy|wipe|erase|purge)\b[\s\S]{0,80}\b(entire|whole|all|every)\b[\s\S]{0,40}\b(project|repository|directory|files?)\b|\b(permanently\s+(delete|remove|erase))\b/i;
        if (dangerousInstructionPattern.test(cleanInstruction)) {
            return res.status(400).json({
                error: "Unsafe agent instruction: destructive project-wide operations are not allowed."
            });
        }

        const hasPathTraversal = cleanInstruction.includes("../") || cleanInstruction.includes("..\\");
        const hasWindowsAbsolutePath = /[A-Za-z]:[\\/]/.test(cleanInstruction);
        const hasUnixAbsolutePath = /(^|\s|["'`(])\//.test(cleanInstruction);

        if (hasPathTraversal || hasWindowsAbsolutePath || hasUnixAbsolutePath) {
            return res.status(400).json({
                error: "Unsafe agent instruction: file paths must remain inside the project workspace."
            });
        }
        let relevantPaths = [];

        try {
            const queryEmbedding = await generateEmbedding(cleanInstruction);
            const results = await searchCode(project._id, queryEmbedding, 8);
            relevantPaths = results.map((result) => result.filePath?.replace(/\\/g,"/")).filter(Boolean);
        } catch (searchError) {
            console.error("Agent planning RAG search failed:", searchError.message);
        }

        relevantPaths = [
            ...new Set(relevantPaths)
        ];

        const projectFiles = await File.find({
            project: project._id,
            type: "file"
        }).sort({
            path: 1
        });

        const fileMap = new Map();
        projectFiles.forEach((file) => {
            fileMap.set(file.path.replace(/\\/g, "/"), file);
        });

        if (fileMap.has("package.json") && !relevantPaths.includes("package.json")) {
            relevantPaths.push("package.json");
        }

        if (fileMap.has("README.md") && !relevantPaths.includes("README.md")) {
            relevantPaths.push("README.md");
        }

        const contextParts = [];
        const MAX_FILE_LENGTH = 5000;
        const MAX_FILES = 10;

        for (const filePath of relevantPaths.slice(0, MAX_FILES)) {
            const projectFile = fileMap.get(filePath);
            if (!projectFile) {
                continue;
            }

            try {
                const workspacePath = path.resolve(project.workspacePath);
                const absolutePath = path.resolve(workspacePath, projectFile.path);
                if (absolutePath !== workspacePath && !absolutePath.startsWith(workspacePath + path.sep)) {
                    continue;
                }

                const content = await fs.readFile(absolutePath,"utf8");
                const trimmedContent = content.length > MAX_FILE_LENGTH ? content.slice(0,MAX_FILE_LENGTH) + "\n\n[File truncated]" : content;
                contextParts.push(`
                    FILE: ${filePath}
                    ${trimmedContent}
                `.trim());
            } catch (fileError) {
                console.error(`Failed to read ${filePath}:`, fileError.message);
            }
        }

        if (contextParts.length === 0) {
            const availableFiles = projectFiles.slice(0, 50).map((file) => file.path.replace(/\\/g,"/")).join("\n");
            contextParts.push(`
                PROJECT FILE STRUCTURE
                ${availableFiles}
            `.trim());
        }

        const projectContext = contextParts.join("\n\n========================================\n\n");
        const plan = await generateAgentPlan(cleanInstruction, projectContext);
        const destructivePlanPattern = /\b(delete|destroy|wipe|erase|purge|permanently\s+remove)\b/i;
        const hasDestructiveStep = plan.steps.some((step) => {
            return destructivePlanPattern.test(
                `${step.description} ${step.reason}`
            );
        });

        if (hasDestructiveStep) {
            return res.status(400).json({
                error: "Unsafe agent plan: destructive file or project operations are not allowed."
            });
        }
        const workspacePath = path.resolve(project.workspacePath);

        const validatedSteps = plan.steps.map((step) => ({
            ...step,
            files: step.files.map((filePath) => filePath.replace(/\\/g, "/").replace(/^\/+/, "").trim()).filter(Boolean).filter((filePath) => {
                if (filePath.includes("node_modules/")) {
                    return false;
                }
                if (filePath.startsWith(".git/")) {
                    return false;
                }
                if (filePath === ".env") {
                    return false;
                }
                const absolutePath = path.resolve(workspacePath, filePath);
                return (
                    absolutePath !== workspacePath && absolutePath.startsWith(workspacePath + path.sep));
            })
        }));

        const task = await AgentTask.create({
            project: project._id,
            owner: req.user._id,
            instruction: cleanInstruction,
            status: "planned",
            plan: {
                summary: plan.summary,
                steps: validatedSteps
            }
        });

        return res.status(200).json({
            taskId: task._id,
            summary: plan.summary,
            steps: validatedSteps
        });
    } catch (error) {
        console.error("Agent planning error:", error);
        return res.status(500).json({
            error: error.message || "Failed to generate agent plan"
        });
    }
};

const executeProjectWithAgent = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (project.cloneStatus !== "cloned" || !project.workspacePath) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const { taskId, instruction, plan } = req.body;

        if (typeof instruction !== "string" || !instruction.trim()) {
            return res.status(400).json({
                error: "Agent instruction is required"
            });
        }

        if (!plan || typeof plan !== "object" || !Array.isArray(plan.steps) || plan.steps.length === 0) {
            return res.status(400).json({
                error: "A valid agent plan is required"
            });
        }

        const task = await AgentTask.findOne({
            _id: taskId,
            project: project._id,
            owner: req.user._id
        });

        if (!task) {
            return res.status(404).json({
                error: "Agent task not found"
            });
        }

        task.status = "running";
        await task.save();

        const projectFiles = await File.find({
            project: project._id,
            type: "file"
        }).sort({ path: 1 }).limit(20);
        const contextParts = [];
        for (const projectFile of projectFiles) {
            try {
                const absolutePath = path.resolve(project.workspacePath, projectFile.path);
                const workspacePath = path.resolve(project.workspacePath);
                if (absolutePath !== workspacePath && !absolutePath.startsWith(workspacePath + path.sep)) {
                    continue;
                }
                const content = await fs.readFile(absolutePath,"utf8");
                contextParts.push(`
                    FILE: ${projectFile.path}
                    ${content.slice(0, 5000)}
                `.trim());
            } catch (fileError) {
                console.error(`Failed to read ${projectFile.path}:`, fileError.message);
            }
        }

        const projectCode = contextParts.join("\n\n========================================\n\n");
        const result = await runAgentLoop({
            workspacePath: project.workspacePath,
            instruction: instruction.trim(),
            plan,
            projectCode
        });

        task.status = "completed";
        task.result = result;
        task.changedFiles = Array.isArray(result.changedFiles)
            ? result.changedFiles
            : [];

        await task.save();

        return res.status(200).json(result);
        } catch (error) {
        console.error("Agent loop execution error:", error);
        if (req.body?.taskId) {
            try {
                const task = await AgentTask.findOne({
                    _id: req.body.taskId,
                    project: req.params.id,
                    owner: req.user._id
                });
                if (task) {
                    task.status = "failed";
                    task.result = {
                        error: error.message || "Failed to execute agent loop"
                    };
                    await task.save();
                }
            } catch (taskError) {
                console.error("Failed to update AgentTask:", taskError.message);
            }
        }
        return res.status(500).json({
            error: error.message || "Failed to execute agent loop"
        });
    }
};

const streamWorkspaceEvents = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        res.status(200);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no-cache");

        if (res.flushHeaders) {
            res.flushHeaders();
        }

        res.write(
            `data: ${JSON.stringify({
                type: "connected"
            })}\n\n`
        );

        startWorkspaceWatcher(
            project._id.toString(),
            project.workspacePath,
            (event) => {
                console.log("WORKSPACE WATCHER EVENT:", event);
                const normalizedPath = event.path
                    .replace(/\\/g, "/")
                    .replace(/^\/+/, "")
                    .trim();

                const workspaceRoot = path.resolve(
                    project.workspacePath
                );

                const absolutePath = path.resolve(
                    workspaceRoot,
                    normalizedPath
                );

                if (
                    absolutePath === workspaceRoot ||
                    !absolutePath.startsWith(
                        workspaceRoot + path.sep
                    )
                ) {
                    return;
                }

                (async () => {
                    try {
                        if (event.event === "add") {
                            const stats = await fs.stat(absolutePath);

                            if (!stats.isFile()) {
                                return;
                            }

                            await File.findOneAndUpdate(
                                {
                                    project: project._id,
                                    path: normalizedPath
                                },
                                {
                                    project: project._id,
                                    path: normalizedPath,
                                    name: path.basename(normalizedPath),
                                    extension: path.extname(normalizedPath),
                                    size: stats.size,
                                    type: "file"
                                },
                                {
                                    upsert: true,
                                    new: true,
                                    setDefaultsOnInsert: true
                                }
                            );

                            console.log(
                                "EXTERNAL FILE SAVED TO DB:",
                                normalizedPath
                            );
                        }

                        if (event.event === "unlink") {
                            const deleteResult = await File.deleteOne({
                                project: project._id,
                                path: normalizedPath
                            });

                            console.log(
                                "EXTERNAL FILE DELETED FROM DB:",
                                normalizedPath,
                                "deleted:",
                                deleteResult.deletedCount
                            );
                        }

                        publish(project._id.toString(), {
                            type: "workspace-change",
                            ...event
                        });
                    } catch (error) {
                        console.error(
                            "Failed to process workspace change:",
                            error
                        );
                    }
                })();
            }
        );

        const unsubscribe = subscribe(
            project._id.toString(),
            res
        );

        const heartbeat = setInterval(() => {
            try {
                res.write(": heartbeat\n\n");
            } catch {
                clearInterval(heartbeat);
                unsubscribe();
            }
        }, 30000);

        req.on("close", () => {
            clearInterval(heartbeat);
            unsubscribe();
        });
    } catch (error) {
        console.error("Workspace event stream error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                error:
                    error.message ||
                    "Failed to stream workspace events"
            });
        }

        res.end();
    }
};

const renameProjectFile = async (req, res) => {
    try {
        const { id, fileId } = req.params;
        const { newName } = req.body;

        if (
            typeof newName !== "string" ||
            !newName.trim()
        ) {
            return res.status(400).json({
                error: "New file name is required"
            });
        }

        const cleanName = newName.trim();

        if (
            cleanName.includes("/") ||
            cleanName.includes("\\") ||
            cleanName === "." ||
            cleanName === ".."
        ) {
            return res.status(400).json({
                error: "Invalid file name"
            });
        }

        const project = await Project.findOne({
            _id: id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (
            project.cloneStatus !== "cloned" ||
            !project.workspacePath
        ) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const file = await File.findOne({
            _id: fileId,
            project: project._id,
            type: "file"
        });

        if (!file) {
            return res.status(404).json({
                error: "File not found"
            });
        }

        const oldPath = file.path.replace(/\\/g, "/");

        const pathParts = oldPath.split("/");
        pathParts[pathParts.length - 1] = cleanName;

        const newPath = pathParts.join("/");

        const workspacePath = path.resolve(
            project.workspacePath
        );

        const oldAbsolutePath = path.resolve(
            workspacePath,
            oldPath
        );

        const newAbsolutePath = path.resolve(
            workspacePath,
            newPath
        );

        if (
            oldAbsolutePath === workspacePath ||
            !oldAbsolutePath.startsWith(
                workspacePath + path.sep
            ) ||
            !newAbsolutePath.startsWith(
                workspacePath + path.sep
            )
        ) {
            return res.status(400).json({
                error: "Invalid file path"
            });
        }

        const existingFile = await File.findOne({
            project: project._id,
            path: newPath,
            _id: { $ne: file._id }
        });

        if (existingFile) {
            return res.status(409).json({
                error: "A file or folder with this name already exists"
            });
        }

        await fs.rename(
            oldAbsolutePath,
            newAbsolutePath
        );

        file.path = newPath;
        file.name = cleanName;
        file.extension = path.extname(cleanName);

        await file.save();

        return res.status(200).json({
            message: "File renamed successfully",
            file
        });
    } catch (error) {
        console.error(
            "renameProjectFile error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to rename file"
        });
    }
};

const deleteProjectFile = async (req, res) => {
    try {
        const { id, fileId } = req.params;

        const project = await Project.findOne({
            _id: id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (
            project.cloneStatus !== "cloned" ||
            !project.workspacePath
        ) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const file = await File.findOne({
            _id: fileId,
            project: project._id,
            type: "file"
        });

        if (!file) {
            return res.status(404).json({
                error: "File not found"
            });
        }

        const filePath = file.path.replace(/\\/g, "/");

        const workspacePath = path.resolve(
            project.workspacePath
        );

        const absoluteFilePath = path.resolve(
            workspacePath,
            filePath
        );

        if (
            absoluteFilePath === workspacePath ||
            !absoluteFilePath.startsWith(
                workspacePath + path.sep
            )
        ) {
            return res.status(400).json({
                error: "Invalid file path"
            });
        }

        await fs.rm(absoluteFilePath, {
            force: false
        });

        await File.deleteOne({
            _id: file._id
        });

        return res.status(200).json({
            message: "File deleted successfully",
            fileId: file._id,
            path: filePath
        });
    } catch (error) {
        console.error(
            "deleteProjectFile error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to delete file"
        });
    }
};

const renameProjectFolder = async (req, res) => {
    try {
        const { id, fileId } = req.params;
        const { newName } = req.body;

        if (
            typeof newName !== "string" ||
            !newName.trim()
        ) {
            return res.status(400).json({
                error: "New folder name is required"
            });
        }

        const cleanName = newName.trim();

        if (
            cleanName.includes("/") ||
            cleanName.includes("\\") ||
            cleanName === "." ||
            cleanName === ".."
        ) {
            return res.status(400).json({
                error: "Invalid folder name"
            });
        }

        const project = await Project.findOne({
            _id: id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (
            project.cloneStatus !== "cloned" ||
            !project.workspacePath
        ) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const folder = await File.findOne({
            _id: fileId,
            project: project._id,
            type: "directory"
        });

        if (!folder) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }

        const oldPath = folder.path
            .replace(/\\/g, "/")
            .replace(/\/+$/, "");

        const pathParts = oldPath.split("/");
        pathParts[pathParts.length - 1] = cleanName;

        const newPath = pathParts.join("/");

        const workspacePath = path.resolve(
            project.workspacePath
        );

        const oldAbsolutePath = path.resolve(
            workspacePath,
            oldPath
        );

        const newAbsolutePath = path.resolve(
            workspacePath,
            newPath
        );

        if (
            oldAbsolutePath === workspacePath ||
            !oldAbsolutePath.startsWith(
                workspacePath + path.sep
            ) ||
            !newAbsolutePath.startsWith(
                workspacePath + path.sep
            )
        ) {
            return res.status(400).json({
                error: "Invalid folder path"
            });
        }

        const existingItem = await File.findOne({
            project: project._id,
            path: newPath,
            _id: { $ne: folder._id }
        });

        if (existingItem) {
            return res.status(409).json({
                error:
                    "A file or folder with this name already exists"
            });
        }

        await fs.rename(
            oldAbsolutePath,
            newAbsolutePath
        );

        const oldPrefix = `${oldPath}/`;
        const newPrefix = `${newPath}/`;

        const children = await File.find({
            project: project._id,
            path: {
                $regex: `^${oldPrefix.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )}`
            }
        });

        for (const child of children) {
            child.path =
                newPrefix +
                child.path.slice(oldPrefix.length);

            await child.save();
        }

        folder.path = newPath;
        folder.name = cleanName;

        await folder.save();

        return res.status(200).json({
            message: "Folder renamed successfully",
            folder
        });
    } catch (error) {
        console.error(
            "renameProjectFolder error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to rename folder"
        });
    }
};

const deleteProjectFolder = async (req, res) => {
    try {
        const { id, fileId } = req.params;

        const project = await Project.findOne({
            _id: id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        if (
            project.cloneStatus !== "cloned" ||
            !project.workspacePath
        ) {
            return res.status(400).json({
                error: "Project repository is not cloned"
            });
        }

        const folder = await File.findOne({
            _id: fileId,
            project: project._id,
            type: "directory"
        });

        if (!folder) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }

        const folderPath = folder.path
            .replace(/\\/g, "/")
            .replace(/\/+$/, "");

        const workspacePath = path.resolve(
            project.workspacePath
        );

        const absoluteFolderPath = path.resolve(
            workspacePath,
            folderPath
        );

        if (
            absoluteFolderPath === workspacePath ||
            !absoluteFolderPath.startsWith(
                workspacePath + path.sep
            )
        ) {
            return res.status(400).json({
                error: "Invalid folder path"
            });
        }

        // Delete the physical folder and everything inside it.
        await fs.rm(absoluteFolderPath, {
            recursive: true,
            force: false
        });

        // Remove the folder record and every child record
        // belonging to this folder.
        const folderPrefix = `${folderPath}/`;

        await File.deleteMany({
            project: project._id,
            path: {
                $regex: `^${folderPrefix.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )}`
            }
        });

        await File.deleteOne({
            _id: folder._id
        });

        return res.status(200).json({
            message: "Folder deleted successfully",
            folderId: folder._id,
            path: folderPath
        });
    } catch (error) {
        console.error(
            "deleteProjectFolder error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to delete folder"
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    cloneProjectRepository,
    scanProject,
    getProjectFiles,
    indexProjectCode,
    searchProjectCode,
    askProjectAI,
    explainSelectedCode,
    fixSelectedCode,
    generateProjectCode,
    getProject,
    getFileContent,
    updateFileContent,
    createProjectFile,
    createProjectFolder,
    reviewProject,
    analyzeProjectCode,
    runProjectCheck,
    runProjectTerminal,
    diagnoseProjectBuild,
    getGitStatus,
    getGitDiff,
    commitGitChanges,
    pullGitChanges,
    pushGitChanges,
    getGitBranches,
    createGitBranch,
    checkoutGitBranch,
    getGitHistory,
    stageGitFile,
    unstageGitFile,
    streamProjectAI,
    generateMultiFileProjectCode,
    generateProjectTests,
    planProjectWithAgent,
    executeProjectWithAgent,
    streamWorkspaceEvents,
    renameProjectFile,
    deleteProjectFile,
    renameProjectFolder,
    deleteProjectFolder,
};