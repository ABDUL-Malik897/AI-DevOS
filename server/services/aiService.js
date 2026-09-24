const ollama = require("ollama").default;

const generateCodeAnswer = async (question, codeContext) => {
    const prompt = `
        You are an AI coding assistant.
        You are helping a developer understand their codebase.

        Use ONLY the provided code context to answer the question.
        If the answer cannot be determined from the context, say that you don't have enough information.

        When possible:
        - Mention the relevant file.
        - Mention line numbers.
        - Explain the code clearly.
        - Do not invent files, functions, or behavior.

        CODE CONTEXT: ${codeContext}
        USER QUESTION: ${question}
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content:  "You are a helpful software engineering assistant."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    });
    return response.message.content;
};

const generateCodeAnswerStream = async (question, codeContext, onToken) => {
    const prompt = `
        You are an AI coding assistant.
        You are helping a developer understand their codebase.
        Use the provided code context and conversation history to answer the question.

        When possible:
        - Mention the relevant file.
        - Mention line numbers when available.
        - Explain the code clearly.
        - Do not invent files, functions, or behavior.
        - If the provided context is insufficient, clearly say what information is missing.

        CODE CONTEXT: ${codeContext}
        USER QUESTION: ${question}
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content: "You are a helpful software engineering assistant."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        stream: true
    });

    let fullAnswer = "";
    for await (const chunk of response) {
        const token = chunk?.message?.content || "";
        if (!token) {
            continue;
        }
        fullAnswer += token;
        if (onToken) {
            await onToken(token);
        }
    }
    return fullAnswer;
};

const generateCodeFix = async (
    code,
    filePath,
    conversationContext = ""
) => {
    const prompt = `
        You are an expert coding assistant.
        You must fix ONLY the selected code.
        FILE: ${filePath || "Unknown"}
        SELECTED CODE: ${code}

        ${conversationContext ? ` CONVERSATION HISTORY: ${conversationContext}` : ""}

        Find the actual syntax or logic error in the selected code and return the corrected replacement.

        IMPORTANT:
        - Return ONLY the replacement code.
        - Do NOT return the entire file.
        - Do NOT add imports.
        - Do NOT add exports.
        - Do NOT add unrelated code.
        - Preserve the surrounding code.
        - The replacement must be syntactically valid.
        - For JSX, make sure every opened JSX tag is correctly closed.
        - For self-closing JSX elements, use the "/>" syntax.
        - Do not use markdown code fences.

        Return EXACTLY valid JSON:

        {
            "explanation": "Briefly explain the actual problem.",
            "fixedCode": "Only the corrected replacement code."
        }

        Before returning the answer, verify that fixedCode is valid code and directly replaces the selected code.
        SELECTED CODE TO REPLACE: ${code}
    `;

    

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content: "You are a precise code-fixing assistant. Return only valid JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format: "json"
    });

    const content = response.message.content.trim();
    let cleanedContent = content;

    if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/\s*```$/, "").trim();
    }
    console.log("RAW AI FIX RESPONSE:");
    console.log(content);
    console.log("CLEANED AI FIX RESPONSE:");
    console.log(cleanedContent);

    try {
        const parsed = JSON.parse(cleanedContent);
        if (typeof parsed.explanation !== "string" || typeof parsed.fixedCode !== "string") {
            throw new Error("Invalid fix response structure");
        }

        if (parsed.fixedCode.includes("```")) {
            throw new Error("AI fix contains markdown code fences");
        }
        return parsed;
    } catch (error) {
        console.error("Failed to parse AI fix response:", content);
        throw new Error("AI returned an invalid fix response");
    }
};

const generateCode = async (instruction, filePath, codeContext, selectedCode) => {
    const hasSelection = typeof selectedCode === "string" && selectedCode.trim().length > 0;
    const taskMode = hasSelection ? "REPLACE THE SELECTED CODE" : "GENERATE NEW CODE";
    const extension = (filePath || "").split(".").pop().toLowerCase();
    const commentSyntax = {
        js: "//",
        jsx: "//",
        ts: "//",
        tsx: "//",
        java: "//",
        c: "//",
        cpp: "//",
        h: "//",
        hpp: "//",
        cs: "//",
        html: "<!-- -->",
        htm: "<!-- -->",
        xml: "<!-- -->",
        css: "/* */",
        scss: "/* */",
        sass: "/* */",
        py: "#",
        sql: "--"
    }[extension] || "//";

    const instructionLower = instruction.toLowerCase();
    let requestedOperation = null;
    let requestedLocation = null;

    if (/\brewrite\b.*\b(entire|whole|file)\b|\b(entire|whole)\s+file\b.*\brewrite\b|\breplace\s+the\s+(entire|whole)\s+file\b|\bcompletely\s+regenerate\b/.test(instructionLower)) {
        requestedOperation = "rewrite";
    } else if (/\b(delete|remove)\b/.test(instructionLower)) {
        requestedOperation = "delete";
    } else if (/\b(replace|modify|change|fix)\b/.test(instructionLower)) {
        requestedOperation = "replace";
    } else if (/\b(add|insert|append)\b/.test(instructionLower)) {
        requestedOperation = "insert";
    }
    if (requestedOperation === "insert") {
        if (/\b(start|beginning|top|before everything)\b/.test(instructionLower)) {
            requestedLocation = "start";
        } else if (/\b(end|bottom|after everything|append)\b/.test(instructionLower)) {
            requestedLocation = "end";
        } else {
            requestedLocation = "cursor";
        }
    }

    const prompt = `
        You are an expert code generation assistant.

        ========================================
        AUTHORITATIVE EDIT OPERATION
        ========================================
        ${requestedOperation || "Determine from the user's request."}

        AUTHORITATIVE INSERTION LOCATION
        ========================================
        ${requestedLocation || "Not applicable."}

        When an authoritative operation or location is provided, you MUST follow it.
        Do not choose a different operation.

        ========================================
        PRIMARY USER REQUEST
        ========================================
        ${instruction}

        ========================================
        TASK MODE
        ========================================
        ${taskMode}

        IMPORTANT:
        The user's request above is the PRIMARY instruction.

        Do NOT treat nearby code errors as the user's request.
        Do NOT automatically fix existing code unless the user explicitly asks you to fix it.
        Do NOT infer the task from the surrounding code.

        ========================================
        TARGET FILE
        ========================================
        ${filePath || "Unknown file"}

        ========================================
        SELECTED CODE
        ========================================
        ${hasSelection ? selectedCode : "[NO CODE SELECTED]"}

        ========================================
        PROJECT CONTEXT
        ========================================

        The following code is REFERENCE CONTEXT ONLY.

        Use it to understand:
        - existing architecture
        - naming conventions
        - imports
        - project patterns
        - reusable components

        Do NOT copy or repair unrelated broken code from the context.

        ${codeContext}

        ========================================
        GENERATION RULES
        ========================================

        1. Follow the PRIMARY USER REQUEST exactly.

        2. First determine the requested edit operation.

        The operation MUST be exactly one of:
        - "insert"
        - "replace"
        - "delete"
        - "rewrite"

        3. Use "insert" when the user asks to:
        - add something
        - insert something
        - append something
        - add a comment
        - add a statement
        - add a function
        - add a component
        - add code without asking to replace existing code

        4. Use "replace" when the user explicitly asks to:
        - replace code
        - change an existing function
        - modify an existing block
        - rewrite a specific selected section
        - fix or alter a specific piece of existing code

        5. Use "delete" when the user explicitly asks to:
        - delete code
        - remove code
        - remove a function
        - remove a block
        - remove a statement

        6. Use "rewrite" ONLY when the user explicitly asks to:
        - rewrite the entire file
        - replace the whole file
        - completely regenerate the file
        - rebuild the entire file

        7. If NO CODE IS SELECTED:
        - Do NOT automatically use "replace".
        - Prefer "insert" unless the user explicitly requests replacement, deletion, or a full rewrite.
        - Generate ONLY the smallest code required for the requested operation.
        - Do NOT generate the entire file unless the operation is "rewrite".
        - Do NOT repeat existing surrounding code.
        - Do NOT repair unrelated existing code.

        8. If CODE IS SELECTED:
        - If the user asks to replace or modify the selected code, use "replace".
        - If the user asks to delete the selected code, use "delete".
        - If the user asks to add code near the selected code, use "insert".
        - Preserve all surrounding code.

        9. Determine the insertion location when the operation is "insert".

        The location MUST be exactly one of:
        - "start"
        - "end"
        - "cursor"

        Use "start" when the user says:
        - at the start
        - at the beginning
        - before everything
        - at the top of the file

        Use "end" when the user says:
        - at the end
        - at the bottom
        - after everything
        - append

        Use "cursor" when no explicit location is requested.

        10. For comments:
        - Always use the correct comment syntax for the target language.
        - JavaScript / TypeScript: // comment
        - HTML: <!-- comment -->
        - CSS / SCSS: /* comment */
        - Python: # comment
        - Java: // comment
        - C / C++: // comment
        - SQL: -- comment
        - Never use "//" automatically for every language.

        11. For a request to create a React component:
        - Generate the complete component required by the request.
        - Do not generate the entire surrounding file unless the operation is "rewrite".

        12. Do not return:
        - markdown
        - code fences
        - unrelated code
        - parser fixes
        - explanations inside the code

        13. The response MUST contain:
        - "explanation"
        - "operation"
        - "code"

        14. Include "location" ONLY when the operation is "insert".

        15. Return ONLY valid JSON.

        ========================================
        OUTPUT
        ========================================

        Return EXACTLY valid JSON:

        {
            "explanation": "Briefly explain the requested edit.",
            "operation": "insert",
            "location": "cursor",
            "code": "Only the code needed for the edit."
        }

        Rules:
        - operation must be "insert", "replace", "delete", or "rewrite".
        - location is required only for "insert".
        - location must be "start", "end", or "cursor".
        - For "delete", code may be an empty string.
        - Do not include any fields other than:
            explanation, operation, location, code.

        ========================================
        COMMENT SYNTAX FOR THIS FILE
        ========================================
        ${commentSyntax}
        When the user asks to add a comment, you MUST use this exact comment syntax.
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content: "You are a code generation assistant. Follow the user's generation request exactly. Do not behave like a bug-fixing assistant unless explicitly asked."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format: "json"
    });

    const content = response.message.content.trim();
    let cleanedContent = content;
    if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/\s*```$/, "").trim();
    }

    try {
        const parsed = JSON.parse(cleanedContent);
        if (
            typeof parsed.explanation !== "string" ||
            typeof parsed.operation !== "string" ||
            typeof parsed.code !== "string"
        ) {
            throw new Error("Invalid generation response structure");
        }

        if (!["insert", "replace", "delete", "rewrite"].includes(parsed.operation)) {
            throw new Error("Invalid generation operation");
        }

        if (
            parsed.operation === "insert" &&
            !["start", "end", "cursor"].includes(parsed.location)
        ) {
            throw new Error("Invalid generation location");
        }
        if (parsed.code.includes("```")) {
            throw new Error("Generated code contains markdown fences");
        }
        return {
            explanation: parsed.explanation,
            operation: requestedOperation || parsed.operation,
            location:
                requestedOperation === "insert"
                    ? requestedLocation
                    : parsed.location || null,
            code: parsed.code
        };
    } catch (error) {
        console.error("Failed to parse AI generation response:", content);
        throw new Error("AI returned an invalid generation response");
    }
};

const generateCodeReview = async (codeContext, staticAnalysis) => {
    const prompt = `
        You are a practical senior software engineer reviewing code.
        Review ONLY the code provided below.
        Your response MUST contain these four JSON fields:

        {
            "summary": "Brief assessment of the code.",
            "critical": [],
            "warnings": [],
            "improvements": []
        }

        Each issue must use this structure:

        {
            "file": "exact/path/from/code",
            "line": 1,
            "message": "Brief explanation"
        }

        IMPORTANT RULES:
        - Return ONLY JSON.
        - Never return {}.
        - Never omit summary.
        - Always return all four fields.
        - If there are no issues, use empty arrays.
        - Use exact file paths from the provided code.
        - Use integer line numbers.
        - Do not invent problems.
        - Maximum 3 critical issues.
        - Maximum 3 warnings.
        - Maximum 3 improvements.
        - Keep messages concise.

        STATIC ANALYSIS RESULTS: ${JSON.stringify(staticAnalysis, null, 2)}

        CODE TO REVIEW: ${codeContext}
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:1.5b",
        messages: [
            {
                role: "system",
                content: `
                You are a precise software code reviewer.
                You MUST return JSON with exactly these top-level fields:
                    summary, critical, warnings, improvements.
                    Never return an empty object.
                    Always include all four fields.
                `
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format: "json"
    });

    const content = response.message.content.trim();
    console.log("RAW AI REVIEW RESPONSE:");
    console.log(content);

    try {
        const parsed = JSON.parse(content);
        const normalizedReview = {
            summary: typeof parsed.summary === "string" ? parsed.summary : "Review completed.",
            critical: Array.isArray(parsed.critical) ? parsed.critical : [],
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            improvements: Array.isArray(parsed.improvements)  ? parsed.improvements : []
        };
        console.log("NORMALIZED AI REVIEW:", normalizedReview);
        return normalizedReview;
    } catch (error) {
        console.error("Failed to parse AI review response:", content);
        throw new Error("AI returned an invalid review response");
    }
};

const diagnoseBuildError = async (buildOutput, projectCode) => {
    const prompt = `
        You are debugging a build failure.
        Analyze the build error and the provided source code.
        Your job is to identify the ACTUAL syntax or code mistake that caused the build to fail, not merely repeat the parser's reported token.

        For example:
        If the parser reports an unexpected ")" but the surrounding code contains an unclosed JSX tag such as "<Products", explain that the JSX tag is incomplete and that this causes the ")" to be unexpected.

        Return ONLY valid JSON:

        {
            "summary": "Short and precise explanation of the root cause.",
            "file": "src/App.jsx",
            "line": 12,
            "message": "Explain exactly what is wrong in the code.",
            "suggestion": "Show the concrete correction."
        }

        Rules:
        - Identify the root cause, not just the parser symptom.
        - Use the exact file path from the build error.
        - Use the reported line when appropriate.
        - Inspect the surrounding source code before explaining the error.
        - Do not invent code or behavior.
        - Do not say only "unexpected token".
        - Keep the message under 40 words.
        - Return ONLY JSON.

        The build tool has already identified the error location.

        The FILE and LINE provided by the build tool are authoritative.
        Do not invent or change the file or line.

        Do not simply repeat "unexpected token".
        Inspect the surrounding source code and identify the actual missing,
        extra, or malformed syntax.

        For JSX:
        - <Component /> is already a valid self-closing element.
        - Do not claim that a self-closing JSX element needs another closing tag.
        - Check surrounding parentheses, braces, fragments, and JSX structure.

        Return only JSON:
        {
        "summary": "...",
        "file": "...",
        "line": 0,
        "message": "...",
        "suggestion": "..."
        }

        BUILD ERROR: ${buildOutput}
        SOURCE CODE: ${projectCode}
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:1.5b",
        messages: [
            {
                role: "system",
                content: "You are a precise build-error debugging assistant. Always return valid JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format: "json"
    });

    const content = response.message.content.trim();
    try {
        return JSON.parse(content);
    } catch (error) {
        console.error("Failed to parse build diagnosis:", content);
        throw new Error("AI returned an invalid diagnosis");
    }
};

const diagnoseTestError = async (testOutput, projectCode) => {
    const normalizedOutput = String(testOutput || "");

    // Node.js assert.strictEqual failure format:
    // "30 !== 25" means actual = 30, expected = 25.
    let actualValue = null;
    let expectedValue = null;

    const strictEqualMatch = normalizedOutput.match(
        /([^\s]+)\s*!==\s*([^\s]+)/
    );

    if (strictEqualMatch) {
        actualValue = strictEqualMatch[1];
        expectedValue = strictEqualMatch[2];
    }

    const prompt = `
        You are diagnosing a test failure.

        The test runner has already determined the following facts:

        ACTUAL VALUE: ${actualValue ?? "unknown"}
        EXPECTED VALUE: ${expectedValue ?? "unknown"}

        FAILED TEST ASSERTION IS AUTHORITATIVE.
        The source code shown below is the implementation under test.
        Diagnose THAT implementation.
        Do not diagnose the test file itself.

        IMPORTANT:
        - ACTUAL VALUE is what the source code returned.
        - EXPECTED VALUE is what the test requires.
        - Never reverse these values.
        - Never suggest changing the test just to match the incorrect implementation.
        - Diagnose the source implementation that produced the actual value.
        - Use the provided source code to identify the incorrect function.
        - Do not invent files or functions.

        TEST OUTPUT:
        ${normalizedOutput}

        SOURCE CODE:
        ${projectCode}

        Return ONLY valid JSON:

        {
            "summary": "Short explanation of the root cause.",
            "file": "Exact source file containing the problem.",
            "line": 1,
            "message": "Explain what the implementation is doing incorrectly.",
            "suggestion": "Explain the correct implementation."
        }

        For this specific kind of failure:
        actual !== expected means the implementation is producing the wrong result.
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:1.5b",
        messages: [
            {
                role: "system",
                content:
                    "You are a precise test-failure debugging assistant. Return only valid JSON."
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
        throw new Error("Test diagnosis returned an empty response");
    }

    try {
        const parsed = JSON.parse(content);

        return {
            ...parsed,
            actualValue,
            expectedValue
        };
    } catch (error) {
        console.error("Failed to parse test diagnosis:", content);
        throw new Error("AI returned an invalid test diagnosis");
    }
};

const generateMultiFileCode = async (instruction, projectContext) => {
    const prompt = `
        You are an expert software engineer making coordinated changes to an existing project.

        ========================================
        PRIMARY USER REQUEST
        ========================================
        ${instruction}

        ========================================
        PROJECT CONTEXT
        ========================================
        ${projectContext}

        ========================================
        TASK
        ========================================

        Analyze the project context and determine which files must change to satisfy the user's request.

        You may:
        - update existing files
        - create new files

        You MUST keep the changes focused on the user's request.

        ========================================
        IMPORTANT RULES
        ========================================

        1. Follow the user's request exactly.

        2. Only modify files that are actually needed.

        3. Maximum 5 file changes.

        4. Do not delete files.

        5. Do not modify:
        - node_modules
        - package-lock.json unless absolutely required
        - .git files
        - binary files
        - environment secret files such as .env

        6. For existing files:
        - Return the COMPLETE new file content.
        - Preserve unrelated existing code.
        - Do not accidentally remove existing functionality.

        7. For new files:
        - Return the complete file content.

        8. Use exact file paths from the provided project context.

        9. Do not invent file paths that are unrelated to the project.

        10. Do not return markdown code fences.

        11. Return ONLY valid JSON.

        ========================================
        OUTPUT FORMAT
        ========================================

        {
            "summary": "Brief explanation of the overall change.",
            "changes": [
                {
                    "filePath": "src/example.js",
                    "action": "update",
                    "reason": "Why this file needs to change.",
                    "content": "Complete new file content."
                }
            ]
        }

        The "action" must be exactly:
        - "update"
        - "create"

        The "content" field must contain complete valid source code.
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content: "You are a precise multi-file code editing assistant. Return only valid JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format: "json"
    });

    const content = response.message.content.trim();

    try {
        const parsed = JSON.parse(content);
        if (typeof parsed.summary !== "string" || !Array.isArray(parsed.changes)) {
            throw new Error("Invalid multi-file response structure");
        }

        const changes = parsed.changes.filter((change) =>
            change && typeof change.filePath === "string" &&
            typeof change.action === "string" && typeof change.reason === "string" &&
            typeof change.content === "string" &&
            (change.action === "update" || change.action === "create")
        ).slice(0, 5);
        if (changes.length === 0) {
            throw new Error("AI returned no valid file changes");
        }
        return {
            summary: parsed.summary,
            changes
        };
    } catch (error) {
        console.error("Failed to parse multi-file generation:", content);
        throw new Error("AI returned an invalid multi-file change response");
    }
};

const generateTests = async (filePath, sourceCode, projectContext) => {
    const prompt = `
        You are an expert software testing engineer.
        Your job is to generate tests for an existing source file.

        ========================================
        TARGET SOURCE FILE
        ========================================
        ${filePath}

        ========================================
        SOURCE CODE
        ========================================
        ${sourceCode}

        ========================================
        PROJECT CONTEXT
        ========================================
        ${projectContext || "No additional project context was provided."}

        ========================================
        TASK
        ========================================

        Generate a useful test file for the target source file.

        IMPORTANT:
        - Determine the testing framework from the project context when possible.
        - Prefer the framework already used by the project.
        - Do not invent a completely different testing stack when an existing one is visible.
        - Test the actual exported behavior of the target file.
        - Cover the most important normal behavior.
        - Cover important edge cases when appropriate.
        - For React components, test rendered behavior and user interaction where appropriate.
        - Do not test implementation details unnecessarily.
        - Do not modify the source file.
        - Return a COMPLETE test file.
        - Use an appropriate test-file name and path.
        - Do not return markdown code fences.
        - Do not include explanations inside the code.
        - Keep the generated tests focused and practical.

        ========================================
        OUTPUT
        ========================================

        Return EXACTLY valid JSON:

        {
            "testFilePath": "src/example.test.js",
            "framework": "vitest",
            "explanation": "Briefly explain what the tests cover.",
            "code": "Complete test file content."
        }
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content: "You are a precise software testing assistant. Return only valid JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format: "json"
    });

    const content = response.message.content.trim();

    try {
        const parsed = JSON.parse(content);
        if (
            typeof parsed.testFilePath !== "string" ||
            !parsed.testFilePath.trim() ||
            typeof parsed.framework !== "string" ||
            typeof parsed.explanation !== "string" ||
            typeof parsed.code !== "string" ||
            !parsed.code.trim()
        ) {
            throw new Error("Invalid test generation response structure");
        }

        if (parsed.code.includes("```")) {
            throw new Error("Generated tests contain markdown fence");
        }

        return {
            testFilePath: parsed.testFilePath.replace(/\\/g, "/").replace(/^\/+/, "").trim(),
            framework: parsed.framework.trim(),
            explanation: parsed.explanation.trim(),
            code: parsed.code
        };
    } catch (error) {
        console.error("Failed to parse AI test generation:", content);
        throw new Error("AI returned an invalid test generation response");
    }
};

const generateAgentPlan = async (instruction, projectContext) => {
    const prompt = `
        You are an expert senior software engineer acting as a coding agent planner.
        Your job is to analyze the user's request and create a safe, concrete implementation plan for an existing software project.

        ========================================
        PRIMARY USER REQUEST
        ========================================
        ${instruction}

        ========================================
        PROJECT CONTEXT
        ========================================
        ${projectContext}

        ========================================
        TASK
        ========================================

        Determine the smallest set of development steps required to satisfy the user's request.
        The plan will later be executed by another system.

        IMPORTANT RULES:

        1. Follow the user's request exactly.
        2. Analyze the existing project before proposing changes.
        3. Reuse existing architecture and patterns whenever possible.
        4. Do NOT invent files that are unnecessary.
        5. Do NOT suggest deleting files.
        6. Do NOT suggest modifying:
        - node_modules
        - .git
        - .env
        - package-lock.json unless absolutely necessary
        7. Each step must be one of:
        - "modify" for a file change
        - "command" for running an approved project command

        8. For "modify" steps:
        - identify the files that will be modified
        - explain what will be changed
        - explain why

        9. For "command" steps:
        - files must be an empty array
        - command must be one of:
            - "test"
            - "build"
            - "lint"
        - do not invent other commands

        10. Do NOT create workflow-only steps such as:
            - locate
            - open
            - read
            - verify
            - save
            - commit
            - report

        11. Use the smallest number of steps necessary.
        12. For "modify" steps, every step must identify the file or files that will actually be modified.
        13. For "command" steps, "files" must be an empty array and "command" must identify the approved command.
        14. Do NOT create steps for:
            - locating a file
            - opening or reading a file
            - inspecting code
            - testing
            - verifying
            - saving
            - committing
            - reporting results
            - explaining changes
        15. Do NOT invent intermediate workflow steps that do not modify files.
        16. For a simple request affecting one existing file, prefer ONE implementation step containing the complete requested change.
        17. If multiple files genuinely need changes, create only the minimum number of implementation steps required.
        18. Do not write actual source code.
        19. Do not return markdown.
        20. Return ONLY valid JSON.N.

        ========================================
        OUTPUT FORMAT
        ========================================

        {
            "summary": "Brief explanation of the overall implementation.",
            "steps": [
                {
                    "step": 1,
                    "type": "modify",
                    "description": "Fix the square function in ai-test.js.",
                    "files": [
                        "ai-test.js"
                    ],
                    "command": null,
                    "reason": "The implementation is currently incorrect."
                }
            ]
        }

        {
            "summary": "Run the project's tests.",
            "steps": [
                {
                    "step": 1,
                    "type": "command",
                    "description": "Run the existing test suite.",
                    "files": [],
                    "command": "test",
                    "reason": "The existing tests verify the current implementation."
                }
            ]
        }

        ========================================
        FINAL CHECK
        ========================================

        Before returning the response:

        - "modify" steps must contain files that will actually be modified.
        - "command" steps must contain files: [] and a valid command.
        - Commands are allowed only for: test, build, lint.
        - There must be NO locate/open/read/verify/save/commit/report steps.
        - Do not invent commands.
        - Do not split one simple file change into unnecessary workflow steps.
        - For a simple change to one existing file, prefer exactly one implementation step.
        - Make sure file paths come from the provided project context whenever possible.
        - Avoid unnecessary changes.
        - Keep the plan ordered logically.
    `;

    const response = await ollama.chat({
        model: "qwen2.5-coder:3b",
        messages: [
            {
                role: "system",
                content: "You are a precise software engineering planning assistant. Return only valid JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],

        format: "json"
    });

    const content = response.message.content.trim();

    try {
        const parsed = JSON.parse(content);
        if (typeof parsed.summary !== "string" || !Array.isArray(parsed.steps)) {
            throw new Error("Invalid agent plan response structure");
        }
        const steps = parsed.steps.filter((step) => step && typeof step.description === "string" && typeof step.reason === "string" && Array.isArray(step.files)).slice(0, 8)
        .map((step, index) => ({
            step: index + 1,
            type: step.type === "command" ? "command" : "modify",
            description: step.description.trim(),
            files: Array.isArray(step.files)
                ? step.files
                    .filter((file) => typeof file === "string")
                    .map((file) =>
                        file.replace(/\\/g, "/").replace(/^\/+/, "").trim()
                    )
                    .filter(Boolean)
                : [],
            command:
                step.type === "command" &&
                ["test", "build", "lint"].includes(step.command)
                    ? step.command
                    : null,
            reason: step.reason.trim()
        }));
        if (steps.length === 0) {
            throw new Error("AI returned no valid agent plan steps");
        }

        return {
            summary: parsed.summary.trim(),
            steps
        };
    } catch (error) {
        console.error("Failed to parse agent plan:", content);
        throw new Error("AI returned an invalid agent plan");
    }
};

module.exports = {
    generateCodeAnswer,
    generateCodeAnswerStream,
    generateCodeFix,
    generateCode,
    generateMultiFileCode,
    generateTests,
    generateCodeReview,
    diagnoseBuildError,
    diagnoseTestError,
    generateAgentPlan
};