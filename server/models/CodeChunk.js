const mongoose = require("mongoose");

const codeChunkSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },

        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        language: {
            type: String,
            default: "text"
        },

        content: {
            type: String,
            required: true
        },

        embedding: {
            type: [Number],
            default: []
        },

        startLine: {
            type: Number,
            required: true
        },

        endLine: {
            type: Number,
            required: true
        },

        chunkIndex: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

codeChunkSchema.index({
    project: 1,
    file: 1,
    chunkIndex: 1
});

module.exports = mongoose.model("CodeChunk",codeChunkSchema);