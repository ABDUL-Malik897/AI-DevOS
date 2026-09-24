import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./WorkspaceAIChat.css";
import API from "../../../../api/api";

const WorkspaceAIChat = ({
    messages,
    asking,
    reviewing,
    openSource,
    conversations,
    activeConversationId,
    onNewConversation,
    onSelectConversation,
    onRetryMessage,
    onEditMessage,
    projectId,
    onDeleteConversation,
    onRenameConversation,
    showEmptyState = true
}) => {

    const showEmpty = showEmptyState && messages.length === 0;
    const [conversationSearch, setConversationSearch] = useState("");
    const [conversationResults, setConversationResults] = useState(null);
    const [searchingConversations, setSearchingConversations] = useState(false);
    const messageEndRef = useRef(null);

    useEffect(() => {
        const query = conversationSearch.trim();

        if (!query) {
            setConversationResults(null);
            setSearchingConversations(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingConversations(true);

                const response = await API.get(
                    `/projects/${projectId}/conversations/search`,
                    {
                        params: {
                            q: query
                        }
                    }
                );

                const data = response.data;

                console.log("CONVERSATION SEARCH:", data);

                setConversationResults(
                    data.conversations || []
                );
            } catch (error) {
                console.error(
                    "Conversation search failed:",
                    error
                );

                setConversationResults([]);
            } finally {
                setSearchingConversations(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [conversationSearch, projectId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, asking]);

    return (
        <>
            <div className="workspace-ai-conversations">
                <div className="workspace-ai-conversations-header">
                    <span>Chats</span>

                    <button
                        type="button"
                        onClick={() => {
                            setConversationSearch("");
                            setConversationResults(null);
                            onNewConversation();
                        }}
                        title="New chat"
                    >
                        + New Chat
                    </button>
                </div>

                <input
                    type="text"
                    value={conversationSearch}
                    onChange={(event) =>
                        setConversationSearch(event.target.value)
                    }
                    placeholder="Search chats..."
                    className="workspace-ai-conversation-search"
                />

                <div className="workspace-ai-conversations-list">
                    {(conversationResults ?? conversations)?.map(
                        (conversation) => (
                            <div
                                key={conversation._id}
                                className={
                                    conversation._id === activeConversationId
                                        ? "workspace-ai-conversation workspace-ai-conversation--active"
                                        : "workspace-ai-conversation"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConversationSearch("");
                                        setConversationResults(null);
                                        onSelectConversation(conversation._id);
                                    }}
                                    className="workspace-ai-conversation-main"
                                >
                                    <div className="workspace-ai-conversation-title">
                                        {conversation.title || "New conversation"}
                                    </div>

                                    {conversation.preview && (
                                        <div className="workspace-ai-conversation-preview">
                                            {conversation.preview}
                                        </div>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="workspace-ai-conversation-delete"
                                    onClick={() => onDeleteConversation(conversation._id)}
                                    title="Delete chat"
                                >
                                    ×
                                </button>

                                <button
                                    type="button"
                                    className="workspace-ai-conversation-rename"
                                    onClick={() =>
                                        onRenameConversation(
                                            conversation._id,
                                            conversation.title || "New conversation"
                                        )
                                    }
                                    title="Rename chat"
                                >
                                    ✎
                                </button>
                            </div>
                        )
                    )}

                    {(conversationResults ?? conversations)?.length === 0 && (
                        <div className="workspace-ai-conversations-empty">
                            {conversationSearch.trim()
                                ? "No matching conversations."
                                : "No conversations yet."}
                        </div>
                    )}
                </div>
            </div>
            <div className="workspace-ai-message-history">
                {showEmpty && (
                    <div className="workspace-ai-empty">
                        <div className="workspace-ai-empty-inner">
                            <div className="workspace-ai-empty-icon">
                                ✦
                            </div>
                            <h3>
                                AI Developer Assistant
                            </h3>
                            <p>
                                Ask questions about your project, select code to explain or fix it, or run an automated project analysis.
                            </p>
                        </div>
                    </div>
                )}
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`workspace-message workspace-message--${message.role}`}
                    >
                        <div className="workspace-message-label">
                            {message.role === "user" ? "YOU" : "AI ASSISTANT"}
                        </div>
                        <div className="workspace-message-markdown">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                        {message.role === "assistant" && message.content && (
                            <button
                                type="button"
                                className="workspace-message-copy"
                                onClick={() =>
                                    navigator.clipboard.writeText(message.content)
                                }
                            >
                                Copy
                            </button>
                        )}

                        {message.role === "assistant" && message.content && (
                            <button
                                type="button"
                                className="workspace-message-retry"
                                onClick={() => {
                                    const previousUserMessage =
                                        messages[index - 1];

                                    if (
                                        previousUserMessage?.role === "user" &&
                                        previousUserMessage.content
                                    ) {
                                        onRetryMessage(
                                            previousUserMessage.content,
                                            index,
                                            previousUserMessage._id
                                        );
                                    }
                                }}
                            >
                                Retry
                            </button>
                        )}

                        {message.role === "user" && message.content && (
                            <button
                                type="button"
                                className="workspace-message-edit"
                                onClick={() =>
                                    onEditMessage(
                                        message.content,
                                        index,
                                        message._id
                                    )
                                }
                            >
                                Edit
                            </button>
                        )}
                        {message.sources?.length > 0 && (
                            <div>
                                {message.sources.map((source, sourceIndex) => (
                                    <button
                                        key={sourceIndex}
                                        type="button"
                                        className="workspace-source"
                                        onClick={() => openSource(source)}
                                    >
                                        {source.filePath}: {source.startLine} - {source.endLine}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {asking && messages[messages.length - 1]?.content === "" && (
                    <div className="workspace-message">
                        <div className="workspace-message-label">
                            AI ASSISTANT
                        </div>
                        <div className="workspace-message-bubble">
                            AI is typing...
                        </div>
                    </div>
                )}
                {reviewing && (
                    <div className="workspace-message">
                        <div className="workspace-message-label">
                            AI ASSISTANT
                        </div>
                        <div className="workspace-message-bubble">
                            AI is reviewing the project...
                        </div>
                    </div>
                )}
                <div ref={messageEndRef} />
            </div>
        </>
    );
};

export default WorkspaceAIChat;