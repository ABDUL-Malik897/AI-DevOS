const mongoose = require("mongoose");

const agentTaskSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        instruction: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["planned", "running", "completed", "failed"],
            default: "planned"
        },
        plan: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        changedFiles: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AgentTask", agentTaskSchema);