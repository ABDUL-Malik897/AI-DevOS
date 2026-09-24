const mongoose = require("mongoose");
const CodeChunk = require("../models/CodeChunk");
const FileDependency = require("../models/FileDependency");
const MAX_DEPENDENCY_FILES = 5;

const searchCode = async (projectId, queryEmbedding, limit = 5) => {
    const results = await CodeChunk.aggregate([
        {
            $vectorSearch: {
                index: "code_chunks_vector_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: 100,
                limit,
                filter: {
                    project: new mongoose.Types.ObjectId(projectId)
                }
            }
        },
        {
            $project: {
                _id: 1,
                project: 1,
                filePath: 1,
                language: 1,
                content: 1,
                startLine: 1,
                endLine: 1,
                chunkIndex: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ]);

    const seedFilePaths = [
        ...new Set(results.map((result) => result.filePath?.replace(/\\/g, "/")).filter(Boolean))
    ];

    if (seedFilePaths.length === 0) {
        return results;
    }

    const dependencies = await FileDependency.find({
        project: new mongoose.Types.ObjectId(projectId),
        $or: [
            {
                sourcePath: {
                    $in: seedFilePaths
                }
            },
            {
                targetPath: {
                    $in: seedFilePaths
                }
            }
        ]
    }).select("sourcePath targetPath importPath dependencyType").lean();

    const relatedDependencies = dependencies.map((dependency) => {
        const sourceIsSeed = seedFilePaths.includes(dependency.sourcePath);
        const targetIsSeed = seedFilePaths.includes(dependency.targetPath);
        if (sourceIsSeed && !targetIsSeed) {
            return {
                relatedPath: dependency.targetPath,
                dependencyDirection: "imports",
                importPath: dependency.importPath,
                dependencyType: dependency.dependencyType
            };
        }
        if (targetIsSeed && !sourceIsSeed) {
            return {
                relatedPath:  dependency.sourcePath,
                dependencyDirection: "imported-by",
                importPath: dependency.importPath,
                dependencyType: dependency.dependencyType
            };
        }
        return null;
    })
    .filter(Boolean);

    const uniqueRelatedDependencies = [
        ...new Map(relatedDependencies.map((dependency) => [
            dependency.relatedPath,
            dependency
        ])).values()
    ].slice(0, MAX_DEPENDENCY_FILES);

    const relatedFilePaths = uniqueRelatedDependencies.map((dependency) => dependency.relatedPath);

    if (relatedFilePaths.length === 0) {
        return results;
    }

    const relatedChunks = await CodeChunk.find({
        project: new mongoose.Types.ObjectId(projectId),
        filePath: {
            $in: relatedFilePaths
        }
    }).select("_id project filePath language content startLine endLine chunkIndex").sort({
        filePath: 1,
        chunkIndex: 1
    }).limit(8).lean();

    const existingResultKeys = new Set(results.map((result) => `${result.filePath}:${result.startLine}:${result.endLine}`));
    const dependencyResults = relatedChunks.map((chunk) => {
        const dependency = uniqueRelatedDependencies.find((item) => item.relatedPath === chunk.filePath);
        return {
            ...chunk,
            score: 0,
            dependencyMatch: true,
            dependencyDirection: dependency?.dependencyDirection || null,
            dependencyReason: dependency?.dependencyDirection === "imports"
                ? "The semantic match imports this file."
                : dependency?.dependencyDirection === "imported-by"
                    ? "This file imports the semantic match."
                    : "Related through project dependency graph.",
            importPath: dependency?.importPath || null,
            dependencyType: dependency?.dependencyType || null
        };
    }).filter((chunk) => {
        const key = `${chunk.filePath}:${chunk.startLine}:${chunk.endLine}`;
        if (existingResultKeys.has(key)) {
            return false;
        }
        existingResultKeys.add(key);
        return true;
    });

    return [...results, ...dependencyResults];
};

module.exports = {
    searchCode
};