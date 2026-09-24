const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const runEslint = async (workspacePath) => {
    const eslintBinary = path.join(workspacePath, "node_modules", ".bin", process.platform === "win32" ? "eslint.cmd" : "eslint");
    try {
        await fs.access(eslintBinary);
    } catch {
        return {
            available: false,
            findings: []
        };
    }

    try {
        const result = await execFileAsync(eslintBinary,
            [
                ".",
                "--format",
                "json"
            ],
            {
                cwd: workspacePath,
                timeout: 30000,
                maxBuffer: 10 * 1024 * 1024,
                windowsHide: true,
                shell: process.platform === "win32"
            }
        );

        return {
            available: true,
            findings: JSON.parse(result.stdout)
        };
    } catch (error) {
        const output = error.stdout || error.stderr || "";
        if (!output.trim()) {
            console.error("ESLint produced no output:", error.message);
            return {
                available: true,
                findings: []
            };
        }

        try {
            return {
                available: true,
                findings: JSON.parse(output)
            };

        } catch (parseError) {
            console.error( "Failed to parse ESLint output:");
            console.error(output);
            return {
                available: true,
                findings: []
            };
        }
    }
};

const analyzeProject = async (workspacePath) => {
    const eslint = await runEslint(workspacePath);

    if (!eslint.available) {
        return {
            critical: [],
            warnings: [
                {
                    file: "project",
                    line: 1,
                    message: "ESLint is not available in this project."
                }
            ],
            improvements: []
        };
    }

    const critical = [];
    const warnings = [];
    const improvements = [];

    for (const file of eslint.findings) {
        for (const message of file.messages) {
            const relativeFile = path.relative(workspacePath, file.filePath);
            const finding = {
                file: relativeFile,
                line: message.line || 1,
                message: message.message
            };
            if (message.severity === 2) {
                critical.push(finding);
            } else if (message.severity === 1) {
                warnings.push(finding);
            }
        }
    }

    return {
        critical,
        warnings,
        improvements
    };
};

module.exports = {
    analyzeProject
};