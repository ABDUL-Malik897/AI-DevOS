const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const MAX_OUTPUT_LENGTH = 1000000;

const COMMANDS = {
    build: ["run", "build"],
    lint: ["run", "lint"],
    test: ["test"]
};

const stripAnsi = (text = "") => {
    return text.replace(/\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,"");
};

const runProjectCommand = (workspacePath, command) => {
    return new Promise(async (resolve) => {
        if (!COMMANDS[command]) {
            return resolve({
                success: false,
                command,
                exitCode: 1,
                stdout: "",
                stderr: `Unsupported command: ${command}`
            });
        }

        if (command === "test") {
            try {
                const packageJsonPath = path.join(workspacePath,"package.json");
                const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
                const packageJson = JSON.parse(packageJsonContent);
                if (!packageJson.scripts || typeof packageJson.scripts.test !== "string" || !packageJson.scripts.test.trim()) {
                    return resolve({
                        success: false,
                        command,
                        exitCode: 1,
                        stdout: "",
                        stderr: "No test script was found in package.json. Add a \"test\" script before running tests."
                    });
                }
            } catch (error) {
                return resolve({
                    success: false,
                    command,
                    exitCode: 1,
                    stdout: "",
                    stderr: error.code === "ENOENT" ? "package.json was not found in the project." : "Failed to read package.json."
                });
            }
        }

        const args = COMMANDS[command];
        const env = {
            ...process.env
        };
        if (command === "test") {
            env.CI = "true";
        }

        const npmProcess = process.platform === "win32" ? spawn("cmd.exe",
            [
                "/d",
                "/s",
                "/c",
                `npm ${args.join(" ")}`
            ],
            {
                cwd: workspacePath,
                windowsHide: true,
                env
            }
        ) : spawn("npm", args,
            {
                cwd: workspacePath,
                env
            }
        );

        let stdout = "";
        let stderr = "";

        npmProcess.stdout.on("data",(data) => {
            stdout += data.toString();
            if (stdout.length > MAX_OUTPUT_LENGTH) {
                stdout = stdout.slice(0, MAX_OUTPUT_LENGTH) + "\n\n[Output truncated]";
            }
        });

        npmProcess.stderr.on("data", (data) => {
            stderr += data.toString();
            if (stderr.length > MAX_OUTPUT_LENGTH) {
                stderr = stderr.slice(0, MAX_OUTPUT_LENGTH) + "\n\n[Output truncated]";
            }
        });

        npmProcess.on("error", (error) => {
            resolve({
                success: false,
                command,
                exitCode: 1,
                stdout: stripAnsi(stdout),
                stderr: stripAnsi(error.message)
            });
        });

        npmProcess.on("close", (code) => {
            resolve({
                success: code === 0,
                command,
                exitCode: code ?? 1,
                stdout: stripAnsi(stdout),
                stderr: stripAnsi(stderr)
            });
        });
    });
};

const runTerminalCommand = async (workspacePath, command) => {
    return new Promise(async(resolve) => {
        const cleanCommand = command.trim();
        const safeWorkspacePath = path.resolve(workspacePath);

        try {
            const stats = await fs.stat(safeWorkspacePath);
            if (!stats.isDirectory()) {
                return resolve({
                    success: false,
                    command: cleanCommand,
                    exitCode: 1,
                    stdout: "",
                    stderr: "Project workspace is not a directory."
                });
            }
        } catch (error) {
            return resolve({
                success: false,
                command: cleanCommand,
                exitCode: 1,
                stdout: "",
                stderr: "Project workspace could not be accessed."
            });
        }

        const blockedPatterns = [
            /rm\s+-rf\s+\//i,
            /del\s+\/[sq]/i,
            /format\s+/i,
            /shutdown\s+/i,
            /reboot\s+/i,
            /mkfs\b/i,
            /diskpart\b/i,
            /:\(\)\s*\{\s*:\|:&\s*\};:/i,
            />\s*\/dev\/sd[a-z]/i
        ];

        if (blockedPatterns.some((pattern) => pattern.test(cleanCommand))) {
            return resolve({
                success: false,
                command: cleanCommand,
                exitCode: 1,
                stdout: "",
                stderr: "Command blocked for security reasons."
            });
        }

        if (!cleanCommand) {
            return resolve({
                success: true,
                command: "",
                exitCode: 0,
                stdout: "",
                stderr: ""
            });
        }

        if (cleanCommand.length > 2000) {
            return resolve({
                success: false,
                command: cleanCommand,
                exitCode: 1,
                stdout: "",
                stderr: "Command is too long. Maximum length is 2000 characters."
            });
        }

        const terminalEnv = {
            PATH: process.env.PATH || "",
            SystemRoot: process.env.SystemRoot || "",
            TEMP: process.env.TEMP || "",
            TMP: process.env.TMP || ""
        };

        const terminalProcess = process.platform === "win32" ? spawn(
            "cmd.exe",
            [
                "/d",
                "/s",
                "/c",
                cleanCommand
            ],
            {
                cwd: safeWorkspacePath,
                windowsHide: true,
                env: terminalEnv
            }
        ) : spawn("/bin/sh",
            [
                "-lc",
                cleanCommand
            ],
            {
                cwd: safeWorkspacePath,
                env: terminalEnv
            }
        );

        let stdout = "";
        let stderr = "";
        let finished = false;

        const finish = (result) => {
            if (finished) {
                return;
            }
            finished = true;
            resolve(result);
        };

        const timeout = setTimeout(() => {
            try {
                terminalProcess.kill();
            } catch {
                // Process may already be closed.
            }

            finish({
                success: false,
                command: cleanCommand,
                exitCode: 124,
                stdout: stripAnsi(stdout),
                stderr: `${stripAnsi(stderr)}\nCommand timed out after 30 seconds.`.trim()
            });
        }, 30000);

        terminalProcess.stdout.on("data", (data) => {
            stdout += data.toString();
            if (stdout.length > MAX_OUTPUT_LENGTH) {
                stdout = stdout.slice(0, MAX_OUTPUT_LENGTH) +  "\n\n[Output truncated]";
            }
        });

        terminalProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            if (stderr.length > MAX_OUTPUT_LENGTH) {
                stderr = stderr.slice(0, MAX_OUTPUT_LENGTH) +  "\n\n[Output truncated]";
            }
        });

        terminalProcess.on("error", (error) => {
            clearTimeout(timeout);
            finish({
                success: false,
                command: cleanCommand,
                exitCode: 1,
                stdout: stripAnsi(stdout),
                stderr: stripAnsi(error.message)
            });
        });

        terminalProcess.on("close", (code) => {
            clearTimeout(timeout);
            finish({
                success: code === 0,
                command: cleanCommand,
                exitCode: code ?? 1,
                stdout: stripAnsi(stdout),
                stderr: stripAnsi(stderr)
            });
        });
    });
};


module.exports = {
    runProjectCommand,
    runTerminalCommand
};