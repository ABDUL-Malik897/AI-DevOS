# AI-DevOS

AI-DevOS is an AI-powered developer workspace designed to bring coding, project understanding, AI assistance, persistent conversations, code generation, debugging, and agent-based development into one environment.

The project is built as a full-stack application with a separate frontend and backend. The frontend provides the developer workspace and AI interaction layer, while the backend manages authentication, projects, files, conversations, AI operations, code intelligence, and agent execution.

## Project Structure

```text
AI-DevOS/
├── client/        # Frontend application
├── server/        # Backend API and AI services
├── workspaces/    # Local project workspaces used by the application
├── README.md
└── .gitignore
```

## Core Features

### Persistent AI Conversations

AI-DevOS supports a ChatGPT-style conversation system for each project.

- Multiple conversations per project
- Persistent message history
- Conversations survive page refreshes
- Create new conversations
- Switch between conversations
- Rename conversations
- Delete conversations
- Search conversations
- Automatic conversation titles
- Scrollable message history
- Edit user messages
- Retry previous requests
- Copy assistant responses

### Context-Aware Code Assistance

The AI can work with code directly from the developer workspace.

- Selected-code understanding
- Current-file context
- Conversation history as AI context
- Related project-code retrieval
- AI code explanation
- AI code fixing
- Diff-based review before applying fixes
- Applying generated fixes directly to the editor

### AI Code Generation

The workspace supports AI-assisted code generation using the project's existing code as reference context.

Generated code can be used with the current file and selected code, allowing the developer to work within the existing project structure instead of generating completely isolated snippets.

### Agent Plan and Execute

AI-DevOS includes an agent workflow that separates planning from execution.

- Generate an execution plan
- Review the proposed plan
- Execute planned steps
- Track agent execution state
- Store execution results

### Project Code Intelligence

The backend includes project-code indexing and semantic retrieval capabilities so AI requests can retrieve relevant project code instead of relying only on the currently selected snippet.

### Developer Workflow Tools

The workspace also includes development-oriented operations such as project review, build checks, test checks, file operations, and editor-based code changes.

## Architecture

```text
┌──────────────────────────┐
│        Client            │
│ React-based workspace    │
│ AI chat + code editor    │
└────────────┬─────────────┘
             │ HTTP / API
             ▼
┌──────────────────────────┐
│        Server            │
│ Express REST API         │
│ Authentication           │
│ Projects & files         │
│ Conversations            │
│ AI controllers/services  │
│ Code intelligence        │
│ Agent execution          │
└────────────┬─────────────┘
             │
       ┌─────┴──────┐
       ▼            ▼
┌────────────┐  ┌──────────────┐
│ MongoDB    │  │ Local project │
│ data       │  │ workspaces    │
└────────────┘  └──────────────┘
             
             ▼
       Local AI services
       / model integration
```

## Technology Stack

### Frontend

- React
- JavaScript
- Axios
- Monaco Editor
- React-based workspace UI

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt
- AI service integration
- Project code indexing and retrieval
- Agent planning and execution

## AI Context Flow

A typical context-aware request can combine several sources of information:

```text
User Request
     │
     ├── Selected Code
     ├── Current Open File
     ├── Conversation History
     └── Related Project Code
              │
              ▼
       AI Context Builder
              │
              ▼
          AI Service
              │
              ▼
       Generated Response
```

This allows the AI to reason about code inside the actual project rather than treating every request as an isolated prompt.

## Conversation Data Model

Conversations are stored separately from their messages.

```text
Project
  │
  ├── Conversation
  │      ├── User Message
  │      ├── Assistant Message
  │      ├── User Message
  │      └── Assistant Message
  │
  └── Conversation
         └── Messages...
```

Each message can also retain the associated file path and selected code context.

## Security

The backend protects project and conversation operations through authenticated requests and verifies the current user as the owner of the requested project or conversation before performing protected operations.

Environment variables are used for secrets and configuration. Real credentials should never be committed to the repository.

## Local Development

Clone the repository and install dependencies independently for the two applications.

```bash
git clone <your-github-repository-url>
cd AI-DevOS
```

### Start the backend

```bash
cd server
npm install
npm start
```

### Start the frontend

Open another terminal:

```bash
cd client
npm install
npm start
```

Use the environment variables required by the backend and frontend configuration.

## Current Development Direction

The project is being developed toward a deeper AI development environment rather than a simple chatbot. The major direction is to combine persistent project conversations, contextual code intelligence, project-wide retrieval, and agent-based execution into a unified developer workflow.

## Repository Notes

The `workspaces/` directory is used for local project workspace data and is intended to remain local rather than being treated as application source code.

---

## Author

Built as an advanced full-stack AI development environment project.





# This Project is still under deeper development phase 