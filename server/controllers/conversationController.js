const Conversation = require("../models/Conversation");
const ConversationMessage = require("../models/ConversationMessage");

const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            project: req.params.id,
            owner: req.user._id
        })
            .sort({ updatedAt: -1 })
            .lean();

        return res.status(200).json({
            conversations
        });
    } catch (error) {
        console.error("Get conversations error:", error);

        return res.status(500).json({
            error: error.message || "Failed to fetch conversations"
        });
    }
};

const createConversation = async (req, res) => {
    try {
        const title =
            typeof req.body?.title === "string" &&
            req.body.title.trim()
                ? req.body.title.trim()
                : "New conversation";

        const conversation = await Conversation.create({
            project: req.params.id,
            owner: req.user._id,
            title
        });

        return res.status(201).json({
            conversation
        });
    } catch (error) {
        console.error("Create conversation error:", error);

        return res.status(500).json({
            error: error.message || "Failed to create conversation"
        });
    }
};

const getConversationMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            project: req.params.id,
            owner: req.user._id
        }).lean();

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        const messages = await ConversationMessage.find({
            conversation: conversation._id
        })
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            messages
        });
    } catch (error) {
        console.error("Get conversation messages error:", error);

        return res.status(500).json({
            error:
                error.message ||
                "Failed to fetch conversation messages"
        });
    }
};

const createConversationMessage = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            project: req.params.id,
            owner: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        const {
            role,
            content,
            filePath,
            selectedCode
        } = req.body;

        if (!["user", "assistant"].includes(role)) {
            return res.status(400).json({
                error: "Invalid message role"
            });
        }

        if (
            typeof content !== "string" ||
            !content.trim()
        ) {
            return res.status(400).json({
                error: "Message content is required"
            });
        }

        const message = await ConversationMessage.create({
            conversation: conversation._id,
            role,
            content: content.trim(),
            filePath: typeof filePath === "string" && filePath.trim() ? filePath.trim()  : null,
            selectedCode: typeof selectedCode === "string" ? selectedCode : ""
        });

        if (role === "user" && conversation.title === "New conversation") {
            const title = content.trim().replace(/\s+/g, " ").slice(0, 60);
            conversation.title = title || "New conversation";
        }

        conversation.updatedAt = new Date();
        await conversation.save();

        return res.status(201).json({
            message
        });
    } catch (error) {
        console.error(
            "Create conversation message error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Failed to create conversation message"
        });
    }
};

const searchConversations = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const query = String(req.query.q || "").trim();

        if (!query) {
            return res.json({
                conversations: []
            });
        }

        const regex = new RegExp(query, "i");

        const matchingMessages =
            await ConversationMessage.find({
                content: regex
            })
                .sort({ createdAt: -1 })
                .lean();

        const matchingConversationIds = [
            ...new Set(
                matchingMessages.map(
                    (message) =>
                        String(message.conversation)
                )
            )
        ];

        const conversations =
            await Conversation.find({
                project: projectId,
                owner: req.user._id,
                $or: [
                    {
                        title: regex
                    },
                    {
                        _id: {
                            $in: matchingConversationIds
                        }
                    }
                ]
            })
                .sort({ updatedAt: -1 })
                .lean();

        const previewMap = new Map();

        matchingMessages.forEach((message) => {
            const conversationId =
                String(message.conversation);

            if (!previewMap.has(conversationId)) {
                previewMap.set(
                    conversationId,
                    message.content
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 120)
                );
            }
        });

        const results = conversations.map(
            (conversation) => ({
                ...conversation,
                preview:
                    previewMap.get(
                        String(conversation._id)
                    ) || ""
            })
        );

        return res.json({
            conversations: results
        });
    } catch (error) {
        console.error(
            "Failed to search conversations:",
            error
        );

        return res.status(500).json({
            error: "Failed to search conversations"
        });
    }
};

const editConversationMessage = async (req, res) => {
    try {
        const { id: projectId, conversationId, messageId } = req.params;
        const { content, selectedCode, filePath } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                error: "Message content is required"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            project: projectId,
            owner: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        const message = await ConversationMessage.findOne({
            _id: messageId,
            conversation: conversation._id,
            role: "user"
        });

        if (!message) {
            return res.status(404).json({
                error: "User message not found"
            });
        }

        await ConversationMessage.deleteMany({
            conversation: conversation._id,
            createdAt: {
                $gt: message.createdAt
            }
        });

        message.content = content.trim();
        message.selectedCode = selectedCode || "";
        message.filePath = filePath || null;

        await message.save();

        conversation.updatedAt = new Date();
        await conversation.save();

        return res.json({
            message
        });
    } catch (error) {
        console.error(
            "Failed to edit conversation message:",
            error
        );

        return res.status(500).json({
            error: "Failed to edit conversation message"
        });
    }
};

const deleteConversation = async (req, res) => {
    try {
        const { id: projectId, conversationId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            project: projectId,
            owner: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        await ConversationMessage.deleteMany({
            conversation: conversation._id
        });

        await Conversation.deleteOne({
            _id: conversation._id
        });

        return res.json({
            message: "Conversation deleted successfully"
        });
    } catch (error) {
        console.error(
            "Failed to delete conversation:",
            error
        );

        return res.status(500).json({
            error: "Failed to delete conversation"
        });
    }
};

const renameConversation = async (req, res) => {
    try {
        const { id: projectId, conversationId } = req.params;
        const { title } = req.body;

        const cleanTitle = String(title || "").trim();

        if (!cleanTitle) {
            return res.status(400).json({
                error: "Conversation title is required"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            project: projectId,
            owner: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        conversation.title = cleanTitle.slice(0, 100);
        await conversation.save();

        return res.json({
            conversation
        });
    } catch (error) {
        console.error(
            "Failed to rename conversation:",
            error
        );

        return res.status(500).json({
            error: "Failed to rename conversation"
        });
    }
};

module.exports = {
    getConversations,
    createConversation,
    getConversationMessages,
    createConversationMessage,
    searchConversations,
    editConversationMessage,
    deleteConversation,
    renameConversation,
};