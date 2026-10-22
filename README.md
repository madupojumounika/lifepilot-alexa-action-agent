# LifePilot — Conversational Goal Planning Agent

**A voice-first planning experience. Clear next steps. Progress you control.**

LifePilot turns a goal into a practical seven-day roadmap, lets people explore their next step through a conversational voice-agent interface, and keeps the final decision in human hands. The experience combines a persistent planning workspace with a remotely hosted **Model Context Protocol (MCP) server** for reusable goal-planning and progress tools.

<p align="center">
  <a href="https://lifepilot-alexa-action-agent.vercel.app/"><strong>🚀 Try the Live App</strong></a>
  &nbsp; • &nbsp;
  <a href="https://lifepilot-alexa-action-agent.vercel.app/api/mcp"><strong>🔌 MCP Endpoint</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/madupojumounika/lifepilot-alexa-action-agent"><strong>💻 Source Code</strong></a>
</p>

<p align="center"><strong>Amazon Developer Hackathon 2026 · Alexa+ Track · Conversational UX + Self-hosted MCP</strong></p>

> **Track approach:** LifePilot combines an Alexa+-inspired conversational web experience with a self-hosted MCP server, goal-specific planning, and a persistent workspace where people review and approve their plans.

---

## Contents

- [Why LifePilot?](#why-lifepilot)
- [Conversational Voice Agent](#conversational-voice-agent)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [MCP Server](#mcp-server)
- [Agent Skill](#agent-skill)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Run Locally](#run-locally)
- [API Routes](#api-routes)
- [Security and Data Boundaries](#security-and-data-boundaries)
- [Roadmap](#roadmap)
- [Demo Walkthrough](#demo-walkthrough)
- [License](#license)

## Built for the Amazon Alexa+ Hackathon

The Alexa+ track supports a self-hosted MCP server implementing MCP specification version **2025-11-25 or later over Streamable HTTP**, as well as a simulated experience built in a web app. LifePilot combines these approaches with a conversational web interface and its deployed MCP tools. See the [official hackathon rules](https://amazonappdev2026.devpost.com/rules) and [official FAQ](https://amazonappdev2026.devpost.com/details/faqs).

### What is implemented

- A remotely deployed MCP endpoint at `/api/mcp`.
- The official TypeScript MCP SDK and Streamable HTTP transport.
- Three registered tools individually tested in MCP Inspector.
- A `lifepilot://capabilities` resource describing the server's scope.
- A separate web app for persistent, user-reviewed goal plans.

### Track implementation

LifePilot demonstrates the track through a conversational web experience backed by a self-hosted MCP server using Streamable HTTP. The current roadmap engine uses goal-specific templates, and the MCP tools provide reusable planning and progress calculations. The experience keeps users in control: proposed plans can be reviewed in the workspace before task tracking begins.

## Conversational Voice Agent

LifePilot Voice brings a voice-first, assistant-style interaction into the existing workspace. Users can type a request or use supported browser speech recognition, choose guided prompts, and see the MCP-backed result directly in the conversation.

- **Natural goal input:** describe the outcome you want to achieve.
- **Roadmap cards:** view seven day-by-day actions with categories, dates, and time estimates.
- **Next-action guidance:** ask LifePilot to recommend the next unfinished step.
- **Progress calculation:** calculate completion from the days marked in the current conversation.
- **Human-controlled handoff:** send a proposed goal into the main workspace to review and approve before tracking it there.
- **Spoken responses:** hear short responses through browser speech synthesis when available.

The interface calls the deployed `/api/mcp` endpoint using JSON-RPC over Streamable HTTP. Voice input depends on browser support and microphone permission. Conversational progress is session-local; the main workspace remains the source for persistent task tracking.

## Why LifePilot?

Big goals can feel overwhelming when the next step is unclear. LifePilot is built around a simple workflow: **define a goal → review a practical plan → take one step at a time → track progress**.

The project combines a lightweight productivity web app with an MCP interface, making it possible to explore both a user-facing planning experience and a reusable tool-based workflow for compatible AI clients.

## Key Features

### Conversational agent experience
- Interact through a dedicated assistant-style conversation panel.
- Start with interview-prep and hackathon quick prompts, or enter a custom goal.
- Use the live MCP endpoint for roadmap generation, next-action recommendations, and progress calculations.
- Use browser voice input and spoken responses where supported.

### Goal planning
- Generate a structured, seven-day roadmap from a user's goal.
- Use goal-specific templates for software engineering interview preparation, hackathons, exams, job searches, software projects, and general goals.
- Organize the roadmap into day-by-day tasks.

### Human-controlled task management
- Review a proposed plan before approving it.
- Mark tasks as complete and reopen them when needed.
- Keep progress visible instead of treating a generated plan as an automatically executed action.

### Personal workspace
- Sign up and sign in with an email and password.
- Keep plans associated with the authenticated account.
- Persist plan and task updates in PostgreSQL.
- Review activity and progress in the web interface.

### Browser voice interaction
- Use browser speech recognition and speech synthesis where the browser and device support them.
- Voice capabilities depend on platform permissions and browser support.

### MCP tools for compatible clients
- Request a seven-day roadmap.
- Get a recommendation for the next unfinished task.
- Calculate task status totals and completion percentage.
- Inspect the `lifepilot://capabilities` resource for the server's declared scope.

## How It Works

1. **Set a goal.** Describe what you want to achieve.
2. **Generate a roadmap.** LifePilot selects a suitable deterministic template and prepares a seven-day plan.
3. **Review the plan.** The proposed plan is presented for human review.
4. **Approve and act.** Approve the plan and update tasks as you make progress.
5. **Track progress.** View task states and activity in the web app.
6. **Use MCP separately.** A compatible MCP client can call the stateless planning and calculation tools exposed by the MCP endpoint.

The MCP tools are a separate interface: they currently calculate results from the input provided by the caller and do **not** read or update the signed-in user's saved web-app plan.

## MCP Server

**MCP endpoint (for compatible MCP clients):** [https://lifepilot-alexa-action-agent.vercel.app/api/mcp](https://lifepilot-alexa-action-agent.vercel.app/api/mcp)  
> This is a protocol endpoint, not a normal webpage. Opening it directly in a browser may show an HTTP content-negotiation error; connect through MCP Inspector or another compatible MCP client instead.

LifePilot exposes a stateless MCP server using the official TypeScript MCP SDK and Streamable HTTP transport.

### Available tools

| Tool | Purpose | Data behavior |
|---|---|---|
| `generate_goal_roadmap` | Generates a proposed seven-day roadmap for a supplied goal. | Returns template-based output; does not save a plan. |
| `recommend_next_action` | Recommends the next unfinished day/task based on the goal and completed day numbers supplied by the caller. | Computes from the request; does not update task state. |
| `calculate_plan_progress` | Calculates totals for pending, approved, and done statuses, plus completion percentage. | Computes from supplied statuses; does not access the database. |

The server also exposes the `lifepilot://capabilities` resource describing the prototype's capabilities and limitations.

### Test with MCP Inspector

1. Start MCP Inspector using a compatible Node.js environment.
2. Connect to the endpoint below using Streamable HTTP.
3. Confirm that the server initializes and lists its tools and resources.
4. Run each tool with valid input and inspect the returned result.

```text
https://lifepilot-alexa-action-agent.vercel.app/api/mcp
```

Example inputs:

**`generate_goal_roadmap`**
```json
{
  "goal": "Prepare for a software engineering interview"
}
```

**`recommend_next_action`**
```json
{
  "goal": "Prepare for a software engineering interview",
  "completedDays": [1, 2]
}
```

**`calculate_plan_progress`**
```json
{
  "statuses": ["done", "done", "pending", "pending", "approved", "pending", "pending"]
}
```

These examples demonstrate tool behavior; they are not evidence of a live generative AI model or external action execution.

## Agent Skill

The portable agent-skill instructions are available at:

[`skills/lifepilot-goal-planning/SKILL.md`](skills/lifepilot-goal-planning/SKILL.md)

The skill explains how a compatible agent should request a roadmap, present it as a proposal, recommend a next step, and calculate progress without claiming that work has been completed automatically. The skill is an instruction file; it does not include or host an AI model by itself.

## Persistent Roadmap History

LifePilot keeps each signed-in user's roadmaps in the database, so starting a new goal does not erase earlier work. The workspace history shows:

- Total roadmaps created, completed roadmaps, and roadmaps still in progress
- Each goal's creation date, completed-task count, and completion percentage
- A one-click action to reopen any saved roadmap and continue tracking it
- A conversational history request, such as "Show my previous roadmaps" or "How many goals have I completed?"

Roadmap completion is calculated from persisted task statuses: a roadmap is complete only when every task is marked done. History is scoped to the authenticated account and retrieved through the authenticated `/api/history` endpoint.

## Architecture

```text
                         ┌──────────────────────────┐
                         │       Web Browser        │
                         │   HTML / CSS / JavaScript│
                         └────────────┬─────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
         /api/auth              /api/plan              /api/task
     Signup / login /       Create and retrieve    Approve / complete /
      session / logout       personal plans          reopen tasks
                │                     │                     │
                └─────────────────────┼─────────────────────┘
                                      ▼
                              Neon PostgreSQL
                           Web-app user and plan data

        Compatible MCP Client ── Streamable HTTP ──> /api/mcp
                                                    ├─ generate_goal_roadmap
                                                    ├─ recommend_next_action
                                                    ├─ calculate_plan_progress
                                                    └─ lifepilot://capabilities
                                                       (stateless computations;
                                                        separate from user DB)
```

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Server-side API | Node.js, Vercel serverless functions |
| Database | PostgreSQL, Neon |
| Database driver | `pg` |
| MCP server | `@modelcontextprotocol/sdk`, Streamable HTTP |
| Input validation | Zod |
| Deployment | Vercel |
| Agent workflow | Portable Markdown `SKILL.md` |

## Run Locally

### Prerequisites

- Node.js 20 or later
- A PostgreSQL database (for example, a Neon project)
- Vercel CLI
- Git

### 1. Clone the repository

```bash
git clone https://github.com/madupojumounika/lifepilot-alexa-action-agent.git
cd lifepilot-alexa-action-agent
git checkout production
npm install
```

### 2. Prepare the database

Create a PostgreSQL database. Run the SQL in `vercel-schema.sql` using your database's SQL editor. For account authentication, also run `auth-migration.sql`.

### 3. Configure the environment

Create a local `.env.local` file in the project root:

```env
DATABASE_URL=your_postgresql_connection_string
```

Replace the placeholder with your own connection string. Keep `.env.local` private and never commit credentials.

### 4. Start the development server

```bash
npx vercel dev
```

Open the local URL printed by Vercel. The web app routes and MCP endpoint will be available on that local server, including `/api/mcp`.

### 5. Verify the MCP endpoint

Connect MCP Inspector or another compatible MCP client to the local `/api/mcp` route. For remote testing, use the deployed endpoint shown above.

> **Database safety:** Never publish your database connection string, passwords, session tokens, or MCP Inspector access tokens. If a credential is exposed, rotate it and update the relevant environment variable.

## API Routes

| Route | Responsibility |
|---|---|
| `/api/auth` | Account signup, login, logout, and session checks |
| `/api/plan` | Create or retrieve the authenticated user's plan |
| `/api/task` | Approve a plan, complete a task, or reopen a completed task |
| `/api/mcp` | Stateless MCP tools and the capabilities resource |

## Security and Data Boundaries

- Web-app plan and task operations are designed around authenticated account ownership.
- Passwords are stored as scrypt hashes; session cookies use HTTP-only and SameSite settings.
- The MCP endpoint currently has no OAuth or per-user MCP authorization.
- MCP calls do not access or mutate private account data; tools operate on the input supplied by the caller.
- Do not send personal, confidential, or sensitive information to the unauthenticated MCP endpoint.
- Keep secrets in environment variables, not source files or screenshots.

This project is a prototype, not a security-audited or production-hardened service.

## Implementation scope

LifePilot is an independent hackathon project that brings together a voice-first conversational interface, a self-hosted MCP server, goal-specific seven-day roadmaps, and a persistent task workspace. The conversational tools operate on the request supplied by the caller; the workspace manages saved plans and task progress. Roadmaps are currently produced by deterministic templates, and browser voice availability depends on device support and microphone permission.

## Roadmap

- [ ] Add a polished conversational web interface that calls the real MCP tools.
- [ ] Add model-backed planning when a suitable model and secure credentials are available.
- [ ] Design an authorization flow before exposing any account-specific MCP operations.
- [ ] Add automated tests for MCP tools, API routes, and critical user flows.
- [ ] Improve rate limiting, observability, error handling, and recovery flows.
- [ ] Improve accessibility and expand cross-browser testing.
- [ ] Explore supported assistant-platform integrations as access and requirements permit.

## Demo Walkthrough

Use the [live application](https://lifepilot-alexa-action-agent.vercel.app/) to demonstrate:

1. Create an account and sign in.
2. Enter a goal and generate a seven-day roadmap.
3. Review and approve the proposed plan.
4. Mark a task complete, then reopen it.
5. Refresh the page to show that the web-app state persists.
6. Use LifePilot Voice to generate a roadmap, request the next action, and calculate progress through the live MCP endpoint. 
7. Open MCP Inspector to show the server's tools and resources for technical verification.

For a clear demo, explain the distinction between the persistent web app and the stateless MCP tools. Browser voice should only be demonstrated on a supported browser/device with the required permissions.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).
