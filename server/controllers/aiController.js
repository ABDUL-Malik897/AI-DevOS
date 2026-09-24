const { generateEmbedding } = require("../services/embeddingService");
const { searchCode } = require("../services/codeSearch");

const searchProjectCode = async (req, res) => {
    try {
        const { id } = req.params;
        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({
                error: "Query is required"
            });
        }
        const queryEmbedding = await generateEmbedding(query);
        const results = await searchCode(id, queryEmbedding,5);
        res.status(200).json({
            results
        });
    } catch (error) {
        console.error("Code search error:", error);
        res.status(500).json({
            error: "Failed to search project code"
        });
    }
};

module.exports = {
    searchProjectCode
};