# AI-DevOS Backend

This directory contains the backend of AI-DevOS. It provides the REST API, authentication, project management, file operations, persistent AI conversations, code intelligence, AI generation, and agent execution features used by the frontend workspace.

## Backend Responsibilities

The server is responsible for:

- User authentication and authorization
- Project creation and project ownership
- Repository/project workspace management
- File and source-code operations
- Persistent conversations and messages
- Conversation search, rename, edit, retry, and deletion support
- AI code explanation
- AI code fixing
- AI code generation
- Project-code indexing and retrieval
- Project review and build/test operations
- Agent planning and execution

## High-Level Structure

```text
server/
├── controllers/
├── models/
├── routes/
├── services/
├── middleware/
├── utils/
├── workspaces/
├── server.js
└── package.json
```

The exact folder contents may evolve as the project grows, but the backend follows a controller / route / model / service separation for its main responsibilities.

## Main Technologies

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Axios-based frontend communication
- Local/remote AI model integration
- Semantic code retrieval

## Authentication

Protected API operations use authenticated requests. Project-scoped operations verify the authenticated user against the project owner before reading or modifying protected project data.

JWT is used for authentication, while bcrypt is used for password hashing.

## Conversation System

The backend stores conversations as project-owned resources and stores messages separately.

### Conversation model

A conversation contains information such as:

```text
project
owner
 title
createdAt
updatedAt
```

### Message model

A message contains information such as:

```text
conversation
role
content
filePath
selectedCode
createdAt
updatedAt
```

Supported message roles are:

```text
user
assistant
```

## Conversation API

The project conversation routes follow this structure:

```text
GET    /projects/:id/conversations
POST   /projects/:id/conversations
GET    /projects/:id/conversations/:conversationId/messages
POST   /projects/:id/conversations/:conversationId/messages
GET    /projects/:id/conversations/search
PUT    /projects/:id/conversations/:conversationId/messages/:messageId
DELETE /projects/:id/conversations/:conversationId
PUT    /projects/:id/conversations/:conversationId
```

The backend also validates that a conversation belongs to the requested project and authenticated owner before returning or modifying its data.

## AI Code Explanation

The Explain Code flow can combine:

```text
Selected Code
Current Open File
Conversation History
Related Project Code
```

The controller builds this context and sends it to the AI service.

Current file content is bounded before being added to the context so very large files do not unnecessarily expand the request.

## AI Code Fixing

The Fix Code flow follows the same contextual approach.

```text
Selected Code
      +
Current File
      +
Conversation Context
      +
Related Project Context
      ↓
AI Fix Generation
      ↓
Fixed Code
```

The backend returns a structured fix result so the frontend can display the change and allow the developer to review or apply it.

## Project Code Intelligence

The backend contains project-code indexing and semantic search capabilities.

A typical retrieval flow is:

```text
User Request
     ↓
Generate Query Embedding
     ↓
Search Indexed Project Code
     ↓
Retrieve Relevant Results
     ↓
Format Code Context
     ↓
AI Service
```

This retrieval layer is used to provide AI requests with project-specific context.

## AI Code Generation

Code generation can use:

- The user's instruction
- Target file path
- Current file content
- Selected code
- Related project code

The generated result is intended to fit the existing project context rather than being treated as an unrelated code sample.

## Agent System

The backend contains an Agent Plan / Agent Execute workflow.

The execution path keeps the planning and execution stages separate so a generated plan can be reviewed before execution.

`AgentTask` is currently used by the execution workflow and should not be treated as an old history-only model.

## Project and File Operations

The backend supports project-scoped file operations used by the editor and AI workflows.

Typical operations include:

- Reading project files
- Updating file content
- Working with the local project workspace
- Reviewing project state
- Running build checks
- Running tests

## Environment Variables

Do not commit real credentials.

A local `.env` file should contain the configuration required by the backend installation, while a safe `.env.example` should contain variable names without secret values.

Example structure:

```env
MONGO_URL=
SECRET=
EMAIL_ADMIN=
EMAIL_PASS=
OLLAMA_URL=
```

The exact variables used by the current installation should be kept synchronized with the backend configuration.

## Running the Backend

```bash
cd server
npm install
npm start
```

For development, use the project's configured development command if available.

## Backend Development Principles

The backend is designed around a few core ideas:

1. Project ownership must be checked before project-scoped access.
2. Conversations are persistent database resources, not temporary frontend state.
3. AI requests should receive the most relevant context available instead of unrelated project data.
4. Agent planning and execution should remain separate stages.
5. Secrets and runtime workspace data should remain outside the public source repository.

## Future Backend Direction

The backend can continue evolving toward stronger project-wide code intelligence, richer symbol-aware retrieval, more advanced agent tools, execution feedback loops, and broader developer workflow automation.