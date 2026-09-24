const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        path: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        extension: {
            type: String,
            default: ""
        },

        size: {
            type: Number,
            default: 0
        },

        type: {
            type: String,
            enum: ["file", "directory"],
            default: "file"
        }
    },
    {
        timestamps: true
    }
);

fileSchema.index(
    {
        project: 1,
        path: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("File", fileSchema);