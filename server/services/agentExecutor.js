const path = require("path");
const fs = require("fs/promises");
const ollama = require("ollama").default;
const { runProjectCommand } = require("./projectRunner");
const MAX_FILE_LENGTH = 12000;

const normalizeRelativePath = (filePath) => {
    return String(filePath || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
};

const validateProjectPath = (workspacePath, relativePath) => {
    const normalizedPath =  normalizeRelativePath(relativePath);

    if (!normalizedPath) {
        throw new Error("Invalid file path");
    }
    if (normalizedPath.includes("node_modules/") || normalizedPath.startsWith("node_modules/")) {
        throw new Error("Agent cannot modify node_modules");
    }

    if (normalizedPath === ".env" || normalizedPath.startsWith(".env/")) {
        throw new Error("Agent cannot modify environment secret files");
    }

    if (normalizedPath === ".git" || normalizedPath.startsWith(".git/")) {
        throw new Error("Agent cannot modify .git");
    }

    const workspaceRoot = path.resolve(workspacePath);
    const absolutePath = path.resolve(workspaceRoot, normalizedPath);

    if (absolutePath === workspaceRoot || !absolutePath.startsWith(workspaceRoot + path.sep)) {
        throw new Error(`Invalid agent file path: ${normalizedPath}`);
    }

    return {
        relativePath: normalizedPath,
        absolutePath
    };
};

const readProjectFile = async (workspacePath, relativePath) => {
    const {relativePath: normalizedPath, absolutePath } = validateProjectPath(workspacePath,relativePath);

    try {
        const content = await fs.readFile(absolutePath,"utf8");
        return {
            filePath: normalizedPath,
            content: content.length > MAX_FILE_LENGTH ? content.slice(0, MAX_FILE_LENGTH) + "\n\n[File truncated]" : content
        };
    } catch (error) {
        if (error.code === "ENOENT") {
            return {
                filePath: normalizedPath,
                content: null
            };
        }
        throw error;
    }
};

const generateStepChanges = async ({instruction,step,fileContents}) => {
    const prompt = `
        You are an autonomous software implementation agent.
        You are executing ONE approved implementation step inside an existing software project.

        ========================================
        USER REQUEST
        ========================================
        ${instruction}

        ========================================
        CURRENT STEP
        ========================================
        Step ${step.step}
        ${step.description}
        WHY THIS STEP IS NEEDED:
        ${step.reason}

        ========================================
        FILES AVAILABLE
        ========================================
        ${fileContents.map((file) => `
            FILE: ${file.filePath}
            ${file.content === null ? "[FILE DOES NOT EXIST YET]" : file.content}
        `).join("\n\n========================================\n\n")}

        ========================================
        TASK
        ========================================
        Implement ONLY this approved step.
        Determine the smallest set of file changes required.

        Rules:

        1. Modify only files necessary for this step.
        2. For an existing file, NEVER return the complete replacement file.
        3. For an existing file with action "update", return:
        - "oldText": an exact snippet copied from the current file
        - "newText": the replacement snippet
        4. The executor will apply the replacement itself.
        5. The oldText must match the current file exactly and should be as small as safely possible.
        6. Do not replace the entire file.
        7. New files may be created with complete "content".
        8. For an existing file where the request adds new code without changing existing code:
            - use "prepend" when the user asks to add it at the top, beginning, or before everything
            - use "append" when the user asks to add it at the end, bottom, or after everything
        9. For action "append" or "prepend", return "content" containing ONLY the new code.
        10. NEVER use "update" for a pure addition when "append" or "prepend" applies.
        11. Never delete files.
        12. Never modify:
            - node_modules
            - .git
            - .env
            - package-lock.json unless absolutely necessary
        13. Use the exact file paths provided above.
        14. Do not invent unrelated files.
        15. Preserve existing functionality unrelated to this step.
        16. Return ONLY valid JSON.

        ========================================
        OUTPUT
        ========================================

        {
            "changes": [
                {
                    "filePath": "relative/path/to/existing-file.js",
                    "action": "update",
                    "oldText": "exact existing snippet",
                    "newText": "replacement snippet"
                }
            ]
        }
        {
            "changes": [
                {
                    "filePath": "relative/path/to/existing-file.js",
                    "action": "append",
                    "content": "ONLY the new content to append"
                }
            ]
        }
        {
            "changes": [
                {
                    "filePath": "relative/path/to/existing-file.js",
                    "action": "prepend",
                    "content": "ONLY the new content to prepend"
                }
            ]
        }

        The action must be one of:
        - "update"
        - "create"
        - "append"
        - "prepend"
        `;

    const response = await ollama.chat({
            model: "qwen2.5-coder:3b",
            messages: [
                {
                    role: "system",
                    content: "You are a precise autonomous code implementation agent. Return only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            format: "json"
        });

    const content = response.message.content?.trim();

    if (!content) {
        throw new Error("Agent returned an empty response");
    }

    const parsed = JSON.parse(content);

    if (!parsed || !Array.isArray(parsed.changes)) {
        throw new Error("Agent returned an invalid execution response");
    }
    return parsed;
};

const executeAgentPlan = async ({workspacePath, instruction, plan}) => {
    if (!workspacePath || typeof workspacePath !== "string") {
        throw new Error("Project workspace path is required");
    }

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
        throw new Error("Agent instruction is required");
    }

    if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
        throw new Error("A valid agent plan is required");
    }

    const executionResults = [];

    for (let index = 0; index < plan.steps.length; index += 1) {
        const step = plan.steps[index];
        if (!step || !Array.isArray(step.files)) {
            throw new Error(`Invalid agent plan step: ${index + 1}`);
        }

        const normalizedStep = {
            step: index + 1,
            type: step.type === "command" ? "command" : "modify",
            description: typeof step.description === "string"
                ? step.description.trim()
                : "",
            reason: typeof step.reason === "string"
                ? step.reason.trim()
                : "",
            files: Array.isArray(step.files)
                ? step.files
                    .filter((file) => typeof file === "string")
                    .map((file) => normalizeRelativePath(file))
                    .filter(Boolean)
                : [],
            command:
                step.type === "command" &&
                ["test", "build", "lint"].includes(step.command)
                    ? step.command
                    : null
        };

        if (normalizedStep.type === "command") {
            if (!["test", "build", "lint"].includes(normalizedStep.command)) {
                throw new Error(
                    `Invalid command step: ${normalizedStep.step}`
                );
            }

            console.log(
                `Agent executing command step ${normalizedStep.step}:`,
                normalizedStep.command
            );

            const commandResult = await runProjectCommand(
                workspacePath,
                normalizedStep.command
            );

            executionResults.push({
                step: normalizedStep.step,
                type: "command",
                status: commandResult.success ? "completed" : "failed",
                description: normalizedStep.description,
                files: [],
                command: normalizedStep.command,
                verification: commandResult
            });

            if (!commandResult.success) {
                throw new Error(
                    `Agent command "${normalizedStep.command}" failed`
                );
            }

            continue;
        }

        if (normalizedStep.files.length === 0) {
            executionResults.push({
                step: normalizedStep.step,
                status: "skipped",
                description: normalizedStep.description,
                files: []
            });
            continue;
        }

        console.log(`Agent executing step ${normalizedStep.step}:`, normalizedStep.description);
        const fileContents = [];
        for (const filePath of normalizedStep.files) {
            const file = await readProjectFile(workspacePath, filePath);
            fileContents.push(file);
        }

        const result = await generateStepChanges({
                instruction: instruction.trim(),
                step: normalizedStep,
                fileContents
            });

        const changes = Array.isArray(result.changes) ? result.changes : [];
        if (changes.length === 0) {
            throw new Error(`Agent returned no changes for step ${normalizedStep.step}`);
        }

        const validatedChanges = changes.map((change) => {
            if (!change || typeof change.filePath !== "string" || typeof change.action !== "string") {
                throw new Error(`Agent returned an invalid file change for step ${normalizedStep.step}`);
            }
            if (
                change.action !== "update" &&
                change.action !== "create" &&
                change.action !== "append" &&
                change.action !== "prepend"
            ) {
                throw new Error(`Invalid agent file action: ${change.action}`);
            }
            const validatedPath = validateProjectPath(workspacePath, change.filePath);
            return {
                ...change,
                filePath: validatedPath.relativePath,
                absolutePath: validatedPath.absolutePath
            };
        });

        const allowedFiles = new Set(normalizedStep.files);
        for (const change of validatedChanges) {
            if (!allowedFiles.has(change.filePath)) {
                throw new Error(`Agent attempted to modify an unapproved file in step ${normalizedStep.step}: ${change.filePath}`);
            }
        }

        const originals = new Map();

        for (const change of validatedChanges) {
            if (originals.has(change.filePath)) {
                continue;
            }

            try {
                const original = await fs.readFile(
                    change.absolutePath,
                    "utf8"
                );

                originals.set(change.filePath, {
                    existed: true,
                    content: original
                });
            } catch (error) {
                if (error.code === "ENOENT") {
                    originals.set(change.filePath, {
                        existed: false,
                        content: null
                    });
                } else {
                    throw error;
                }
            }
        }

        for (const change of validatedChanges) {
            const original = originals.get(change.filePath);

            if (change.action === "update") {
                if (!original?.existed) {
                    throw new Error(
                        `Agent attempted to update a file that does not exist: ${change.filePath}`
                    );
                }

                if (
                    typeof change.oldText !== "string" ||
                    typeof change.newText !== "string"
                ) {
                    throw new Error(
                        `Agent returned an invalid update operation for ${change.filePath}`
                    );
                }

                if (!change.oldText.trim()) {
                    throw new Error(
                        `Agent returned an empty oldText for ${change.filePath}`
                    );
                }

                const originalLineEnding = original.content.includes("\r\n")
                    ? "\r\n"
                    : "\n";

                const normalizedOriginal = original.content
                    .replace(/\r\n/g, "\n")
                    .replace(/\r/g, "\n");

                const normalizedOldText = change.oldText
                    .replace(/\r\n/g, "\n")
                    .replace(/\r/g, "\n");

                const firstIndex = normalizedOriginal.indexOf(
                    normalizedOldText
                );

                if (firstIndex === -1) {
                    throw new Error(
                        `Agent update could not find the specified oldText in ${change.filePath}`
                    );
                }

                const secondIndex = normalizedOriginal.indexOf(
                    normalizedOldText,
                    firstIndex + normalizedOldText.length
                );

                if (secondIndex !== -1) {
                    throw new Error(
                        `Agent update is ambiguous: oldText appears more than once in ${change.filePath}`
                    );
                }

                let updatedContent =
                    normalizedOriginal.slice(0, firstIndex) +
                    change.newText +
                    normalizedOriginal.slice(
                        firstIndex + normalizedOldText.length
                    );

                if (originalLineEnding === "\r\n") {
                    updatedContent = updatedContent.replace(/\n/g, "\r\n");
                }

                change.content = updatedContent;
            }

            if (change.action === "append") {
                const functionMatch = change.content.match(
                    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/
                );

                if (functionMatch && original?.existed) {
                    const functionName = functionMatch[1];

                    const existingFunctionPattern = new RegExp(
                        `\\bfunction\\s+${functionName}\\s*\\(`
                    );

                    if (existingFunctionPattern.test(original.content)) {
                        throw new Error(
                            `Agent attempted to append an existing function "${functionName}" in ${change.filePath}. Existing functions must be updated, not appended.`
                        );
                    }
                }
                if (!original?.existed) {
                    throw new Error(
                        `Agent attempted to append to a file that does not exist: ${change.filePath}`
                    );
                }

                if (
                    typeof change.content !== "string" ||
                    !change.content.trim()
                ) {
                    throw new Error(
                        `Agent returned invalid append content for ${change.filePath}`
                    );
                }

                const originalLineEnding =
                    original.content.includes("\r\n")
                        ? "\r\n"
                        : "\n";

                let appendContent = change.content
                    .replace(/\r\n/g, "\n")
                    .replace(/\r/g, "\n")
                    .replace(/^\n+/, "");

                if (originalLineEnding === "\r\n") {
                    appendContent = appendContent.replace(/\n/g, "\r\n");
                }

                const separator = original.content.endsWith("\n") ? "" : originalLineEnding;
                change.content = original.content + separator + appendContent;
            }

            if (change.action === "prepend") {
                if (!original?.existed) {
                    throw new Error(`Agent attempted to prepend to a file that does not exist: ${change.filePath}`);
                }

                if (typeof change.content !== "string" || !change.content.trim()) {
                    throw new Error(`Agent returned invalid prepend content for ${change.filePath}`);
                }

                const originalLineEnding = original.content.includes("\r\n") ? "\r\n" : "\n";
                let prependContent = change.content
                    .replace(/\r\n/g, "\n")
                    .replace(/\r/g, "\n")
                    .replace(/\n+$/, "");

                if (originalLineEnding === "\r\n") {
                    prependContent = prependContent.replace(/\n/g, "\r\n");
                }

                const separator =
                    original.content.length > 0
                        ? originalLineEnding
                        : "";

                change.content =
                    prependContent +
                    separator +
                    original.content;
            }

            if (change.action === "create") {
                if (original?.existed) {
                    throw new Error(
                        `Agent attempted to create an existing file: ${change.filePath}`
                    );
                }

                if (typeof change.content !== "string") {
                    throw new Error(
                        `Agent returned invalid content for new file ${change.filePath}`
                    );
                }
            }

        }

        const appliedFiles = [];

        try {
            for (const change of validatedChanges) {
                await fs.mkdir(path.dirname(change.absolutePath), {
                    recursive: true
                });
                await fs.writeFile(change.absolutePath, change.content, "utf8");
                appliedFiles.push(change.filePath);
                if (appliedFiles.length === 1 && process.env.TEST_AGENT_ROLLBACK === "true") {
                    throw new Error("Intentional rollback test failure");
                }
            }
        } catch (writeError) {
            console.error(`Agent failed while applying step ${normalizedStep.step}:`, writeError);
            for (const change of validatedChanges) {
                const original = originals.get(change.filePath);
                if (!original) {
                    continue;
                }
                try {
                    if (original.existed) {
                        await fs.writeFile(change.absolutePath, original.content, "utf8");
                    } else {
                        await fs.rm(change.absolutePath, {force: true});
                    }
                } catch (rollbackError) {
                    console.error( `Agent rollback failed for ${change.filePath}:`, rollbackError);
                }
            }
            throw new Error(`Failed to apply agent step ${normalizedStep.step}: ${writeError.message}`);
        }

        executionResults.push({
            step: normalizedStep.step,
            status: "completed",
            description: normalizedStep.description,
            files: appliedFiles
        });
    }

    return {
        status: "completed",
        summary: typeof plan.summary === "string" ? plan.summary : "Agent plan executed successfully.",
        steps: executionResults
    };
};

module.exports = {
    normalizeRelativePath,
    validateProjectPath,
    readProjectFile,
    generateStepChanges,
    executeAgentPlan
};