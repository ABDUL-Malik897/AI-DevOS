const mongoose = require("mongoose");

const conversationMessageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true
        },

        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        content: {
            type: String,
            required: true
        },

        filePath: {
            type: String,
            trim: true,
            default: null
        },

        selectedCode: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

conversationMessageSchema.index({
    conversation: 1,
    createdAt: 1
});

module.exports = mongoose.model(
    "ConversationMessage",
    conversationMessageSchema
);