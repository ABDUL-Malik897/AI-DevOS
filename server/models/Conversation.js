const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        title: {
            type: String,
            trim: true,
            default: "New conversation"
        }
    },
    {
        timestamps: true
    }
);

conversationSchema.index({ project: 1, owner: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);