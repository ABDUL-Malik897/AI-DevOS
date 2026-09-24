const ollama = require("ollama").default;

const generateEmbedding = async (text) => {
    const response = await ollama.embed({
        model: "nomic-embed-text",
        input: text
    });
    return response.embeddings[0];
};

module.exports = {
    generateEmbedding
};