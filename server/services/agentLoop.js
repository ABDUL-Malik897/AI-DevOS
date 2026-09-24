const { executeAgentPlan } = require("./agentExecutor");
const { runProjectCommand } = require("./projectRunner");
const {
    diagnoseBuildError,
    diagnoseTestError
} = require("./aiService");
const fs = require("fs/promises");
const path = require("path");
const MAX_ATTEMPTS = 3;

const runAgentLoop = async ({workspacePath, instruction, plan, projectCode}) => {

    if (!workspacePath) {
        throw new Error("Workspace path is required");
    }
    if (typeof instruction !== "string" || !instruction.trim()) {
        throw new Error("Agent instruction is required");
    }
    if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
        throw new Error("A valid agent plan is required");
    }

    const attempts = [];
    const execution = await executeAgentPlan({
        workspacePath,
        instruction: instruction.trim(),
        plan
    });

    attempts.push({
        attempt: 1,
        execution
    });

    let verification;
    let verificationType = "test";

    try {
        const packageJsonPath = path.join(
            workspacePath,
            "package.json"
        );

        const packageJson = JSON.parse(
            await fs.readFile(packageJsonPath, "utf8")
        );

        if (packageJson?.scripts?.test) {
            verification = await runProjectCommand(
                workspacePath,
                "test"
            );
        } else if (packageJson?.scripts?.build) {
            verificationType = "build";

            verification = await runProjectCommand(
                workspacePath,
                "build"
            );
        } else {
            verification = {
                success: true,
                skipped: true,
                reason: "No test or build script found in package.json"
            };
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            verification = {
                success: true,
                skipped: true,
                reason: "No package.json found; verification skipped"
            };
        } else {
            throw error;
        }
    }

    let diagnosis = null;

    if (!verification.success) {
        const output = [
            verification.stdout,
            verification.stderr
        ].filter(Boolean).join("\n");

        diagnosis =
            verificationType === "test"
                ? await diagnoseTestError(
                    output,
                    projectCode || ""
                )
                : await diagnoseBuildError(
                    output,
                    projectCode || ""
                );
    }

    return {
        status: verification.success ? "completed" : "failed",
        attempts,
        verification,
        diagnosis
    };
};

module.exports = {
    runAgentLoop,
    MAX_ATTEMPTS
};