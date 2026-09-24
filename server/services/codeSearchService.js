const CodeChunk = require("../models/CodeChunk");

const cosineSimilarity = (a, b) => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        magnitudeA += a[i] * a[i];
        magnitudeB += b[i] * b[i];
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return (dotProduct /(Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)));
};

const searchCode = async (projectId, queryEmbedding, limit = 5) => {
    const chunks = await CodeChunk.find({
        project: projectId
    }).lean();

    const results = chunks.filter((chunk) =>  chunk.embedding && chunk.embedding.length > 0)
        .map((chunk) => ({
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
        })).sort((a, b) => b.score - a.score).slice(0, limit);
    return results;
};

module.exports = {
    searchCode
};