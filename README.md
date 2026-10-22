# LifePilot — AI Action Agent

**Turn a goal into a clear plan. Keep a human in control. Make progress visible.**

LifePilot is a web-based goal-planning prototype inspired by personal assistant experiences. It helps users turn a goal into a proposed seven-day roadmap, review and approve the plan, track tasks, and monitor progress. A separate, self-hosted **Model Context Protocol (MCP)** endpoint exposes planning and progress tools to compatible MCP clients.

> **Project scope:** LifePilot is an independent prototype, not an official Alexa+ integration. Its roadmap generation currently uses deterministic templates—not a live LLM—and the MCP tools do not execute actions or access a user's saved web-app plans.

<p align="center">
  <a href="https://lifepilot-alexa-action-agent.vercel.app/"><strong>🚀 Open the Live Demo</strong></a>
  &nbsp; • &nbsp;
  <a href="https://lifepilot-alexa-action-agent.vercel.app/api/mcp"><strong>🔌 MCP Endpoint</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/madupojumounika/lifepilot-alexa-action-agent"><strong>💻 Source Code</strong></a>
</p>

---

## Contents

- [Why LifePilot?](#why-lifepilot)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [MCP Server](#mcp-server)
- [Agent Skill](#agent-skill)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Run Locally](#run-locally)
- [API Routes](#api-routes)
- [Security and Data Boundaries](#security-and-data-boundaries)
- [Current Limitations](#current-limitations)
- [Roadmap](#roadmap)
- [Demo Walkthrough](#demo-walkthrough)
- [License](#license)

## Why LifePilot?

Big goals can feel overwhelming when the next step is unclear. LifePilot is built around a simple workflow: **define a goal → review a practical plan → take one step at a time → track progress**.

The project combines a lightweight productivity web app with an MCP interface, making it possible to explore both a user-facing planning experience and a reusable tool-based workflow for compatible AI clients.

## Key Features

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

**Endpoint:** [https://lifepilot-alexa-action-agent.vercel.app/api/mcp](https://lifepilot-alexa-action-agent.vercel.app/api/mcp)

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

## Current Limitations

- Roadmap generation is deterministic and template-based; no live generative AI model is currently connected.
- The web app is not an official Alexa+ integration and does not connect to an Alexa device or Amazon Bedrock.
- The MCP endpoint provides planning and calculation tools; it does not perform external actions or modify stored web-app plans.
- The MCP endpoint does not currently provide OAuth or per-user authorization.
- Rate limiting, monitoring, password recovery, email verification, and a comprehensive automated integration-test suite remain future work.
- Browser voice features vary by browser, device, permissions, and language support.

## Roadmap

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
6. Open MCP Inspector and demonstrate all three tools: roadmap generation, next-action recommendation, and progress calculation.

For a clear demo, explain the distinction between the persistent web app and the stateless MCP tools. Browser voice should only be demonstrated on a supported browser/device with the required permissions.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).
