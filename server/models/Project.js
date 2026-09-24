const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        githubRepoId: {
            type: String,
            required: true
        },

        githubRepoName: {
            type: String,
            required: true
        },

        githubFullName: {
            type: String,
            required: true
        },

        githubOwner: {
            type: String,
            required: true
        },

        githubUrl: {
            type: String,
            default: ""
        },

        defaultBranch: {
            type: String,
            default: "main"
        },

        language: {
            type: String,
            default: null
        },
        workspacePath: {
            type: String,
            default: null
        },

        cloneStatus: {
            type: String,
            enum: ["not_cloned", "cloning", "cloned", "failed"],
            default: "not_cloned"
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Project", projectSchema);