# AI-DevOS Frontend

This directory contains the frontend application for AI-DevOS. It provides the main developer workspace, code editor, project navigation, persistent AI chat interface, contextual code actions, agent controls, and developer workflow UI.

## Frontend Responsibilities

The client is responsible for:

- Developer workspace UI
- Project and file navigation
- Code editing
- AI chat interaction
- Conversation switching and management
- Message rendering
- Message editing and retry
- Selected-code actions
- AI explanation and fix workflows
- Agent Plan and Execute controls
- Build/test/review workflow controls
- Displaying AI responses, results, diffs, and status

## Main Technologies

- React
- JavaScript
- Axios
- Monaco Editor
- React component architecture
- Context/state-based application flow

## High-Level Structure

```text
client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── services/
│   └── ...
├── public/
└── package.json
```

## AI Workspace

The main workspace connects the code editor with the AI assistant.

The user can:

```text
Open File
   ↓
Select Code
   ↓
Ask AI / Explain / Fix
   ↓
Receive Context-Aware Response
```

The AI interaction layer keeps the project, active conversation, selected code, current file, and AI response connected.

## Persistent Conversations

The frontend maintains an active conversation for the current project and loads its messages from the backend.

Supported operations include:

- New Chat
- Select Chat
- Search Chat
- Rename Chat
- Delete Chat
- Edit User Message
- Retry User Message
- Copy Assistant Response
- Scroll through message history

Conversations are loaded again after refresh, so chat history is not dependent on browser-only state.

## Message Flow

A normal AI request follows this general flow:

```text
User enters prompt
       ↓
Frontend sends request
       ↓
Backend processes project context
       ↓
AI response streams back
       ↓
Frontend renders response
       ↓
Conversation message is persisted
```

## Selected-Code Explain

When code is selected in the editor, the frontend sends information such as:

```text
selectedCode
filePath
conversationId
currentFileContent
```

The backend can then combine that information with conversation and project context before generating the explanation.

## Selected-Code Fix

The Fix action works similarly:

```text
Selected Code
     ↓
Current File Context
     ↓
Conversation Context
     ↓
Backend AI Fix
     ↓
Generated Fixed Code
     ↓
Diff / Review UI
     ↓
Apply Fix
```

The frontend keeps the generated fix separate from the editor until the developer chooses to apply it.

## AI Chat UI

The AI chat interface includes:

- Conversation list
- Search field
- New Chat action
- Conversation selection
- Rename and delete controls
- Message history
- Auto-scroll behavior
- Assistant response actions
- Empty and no-result states

## Agent UI

The workspace supports an Agent Plan / Execute workflow.

The frontend can display the generated plan, allow the developer to review it, and start execution while exposing execution state and results.

The old Agent History UI has been removed; Agent planning and execution remain part of the application.

## API Communication

The client communicates with the backend through Axios-based API calls.

Conversation endpoints include:

```text
/projects/:projectId/conversations
/projects/:projectId/conversations/:conversationId/messages
/projects/:projectId/conversations/search
```

AI operations include project-scoped endpoints for normal chat, code explanation, and code fixing.

## Local Development

Install dependencies:

```bash
cd client
npm install
```

Start the development server using the project's configured command, commonly:

```bash
npm start
```

The frontend should be configured to communicate with the local backend API.

## Frontend State

The workspace tracks information such as:

```text
current project
selected file
file content
selected code
active conversation
conversation list
messages
AI loading state
agent plan state
agent execution state
AI fix/diff state
```

Keeping these states connected allows the editor and AI assistant to behave as a single developer workspace rather than as unrelated screens.

## UI / Developer Experience Goals

The frontend is designed around a workflow where a developer can stay inside the workspace while moving between:

```text
Code → Chat → Context → Explain/Fix → Review → Apply → Agent Execution
```

This keeps AI assistance close to the code being worked on.

## Future Frontend Direction

The frontend can continue evolving with richer code-context selection, symbol-aware navigation, contextual actions such as refactoring and test generation, better long-conversation navigation, agent progress visualization, and deeper project-wide AI workflows.
