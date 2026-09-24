const fs = require("fs/promises");
const path = require("path");
const { generateEmbedding } = require("./embeddingService");
const FileDependency = require("../models/FileDependency");
const File = require("../models/File");
const CodeChunk = require("../models/CodeChunk");

const supportedExtensions = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".cs",
    ".html",
    ".css",
    ".scss",
    ".json",
    ".md",
    ".sql",
    ".yml",
    ".yaml"
]);

const ignoredFileNames = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
]);

const MAX_FILE_SIZE = 500 * 1024;

const getLanguage = (extension) => {
    const languages = {
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
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
        ".html": "html",
        ".css": "css",
        ".scss": "scss",
        ".json": "json",
        ".md": "markdown",
        ".sql": "sql",
        ".yml": "yaml",
        ".yaml": "yaml"
    };

    return languages[extension] || "text";
};

const sensitiveFiles = new Set([
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test"
]);

const createChunks = (content) => {
    const lines = content.split(/\r?\n/);
    const chunks = [];
    const CHUNK_SIZE = 100;
    const OVERLAP = 20;
    let start = 0;
    let chunkIndex = 0;

    while (start < lines.length) {
        const end = Math.min(start + CHUNK_SIZE, lines.length);
        const chunkContent = lines.slice(start, end).join("\n");
        if (chunkContent.trim()) {
            chunks.push({
                content: chunkContent,
                startLine: start + 1,
                endLine: end,
                chunkIndex
            });
            chunkIndex++;
        }
        if (end === lines.length) {
            break;
        }
        start = end - OVERLAP;
    }
    return chunks;
};

const extractDependencies = (content) => {
    const dependencies = [];
    const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
    const requireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
    const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

    let match;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        dependencies.push({
            importPath: match[1],
            dependencyType: "import"
        });
    }

    while ((match = importRegex.exec(content)) !== null) {
        dependencies.push({
            importPath: match[1],
            dependencyType: "import"
        });
    }
    while ((match = requireRegex.exec(content)) !== null) {
        dependencies.push({
            importPath: match[1],
            dependencyType: "require"
        });
    }
    return dependencies;
};

const resolveDependencyPath = (sourcePath, importPath, projectFiles) => {
    if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
        return null;
    }

    const sourceDirectory = path.posix.dirname(sourcePath.replace(/\\/g, "/"));
    const basePath = path.posix.normalize(path.posix.join(sourceDirectory, importPath));

    const candidates = [
        basePath,
        `${basePath}.js`,
        `${basePath}.jsx`,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        `${basePath}.json`,
        `${basePath}.css`,
        `${basePath}.scss`,
        `${basePath}/index.js`,
        `${basePath}/index.jsx`,
        `${basePath}/index.ts`,
        `${basePath}/index.tsx`
    ];

    const normalizedFiles = new Map(projectFiles.map((file) => [
        file.path.replace(/\\/g, "/"), file]
    ));

    for (const candidate of candidates) {
        const normalizedCandidate = candidate.replace(/\\/g, "/");
        if (normalizedFiles.has(normalizedCandidate)) {
            return normalizedFiles.get(normalizedCandidate);
        }
    }
    return null;
};

const processProjectCode = async (project) => {
    const files = await File.find({
        project: project._id,
        type: "file"
    });

    const projectFiles = files.filter((file) =>
        !sensitiveFiles.has(file.name) &&
        !file.name.startsWith(".env.") &&
        supportedExtensions.has(file.extension) &&
        !ignoredFileNames.has(file.name) &&
        file.size <= MAX_FILE_SIZE
    );

    await CodeChunk.deleteMany({
        project: project._id
    });

    await FileDependency.deleteMany({
        project: project._id
    });

    let processedFiles = 0;
    let totalChunks = 0;

    for (const file of projectFiles) {
        if (sensitiveFiles.has(file.name) || file.name.startsWith(".env.")) {
            continue;
        }
        if (!supportedExtensions.has(file.extension)) {
            continue;
        }
        if (ignoredFileNames.has(file.name)) {
            continue;
        }
        if (file.size > MAX_FILE_SIZE) {
            continue;
        }
        const absolutePath = path.join(project.workspacePath, file.path);
        let content;
        try {
            content = await fs.readFile(absolutePath, "utf8");
        } catch (error) {
            console.error(`Skipping ${file.path}:`, error.message);
            continue;
        }
        if (!content.trim()) {
            continue;
        }
        const dependencies = extractDependencies(content);
        const chunks = createChunks(content);
        if (!chunks.length) {
            continue;
        }
        const language = getLanguage(file.extension);
        const documents = [];
        for (const dependency of dependencies) {
            const targetFile = resolveDependencyPath(
                file.path,
                dependency.importPath,
                projectFiles
            );
            if (!targetFile) {
                continue;
            }
            await FileDependency.create({
                project: project._id,
                sourceFile: file._id,
                sourcePath: file.path,
                targetFile: targetFile._id,
                targetPath: targetFile.path,
                importPath: dependency.importPath,
                dependencyType: dependency.dependencyType
            });
        }
        console.log(`Indexing ${file.path} - ${chunks.length} chunks`);

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(`${file.path}\n${chunk.content}`);
            documents.push({
                project: project._id,
                file: file._id,
                filePath: file.path,
                language,
                content: chunk.content,
                embedding,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                chunkIndex: chunk.chunkIndex
            });
        }
        await CodeChunk.insertMany(documents);
        processedFiles++;
        totalChunks += documents.length;
    }

    return {
        processedFiles,
        totalChunks
    };
};

module.exports = {
    processProjectCode
};