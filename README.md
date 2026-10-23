# LifePilot — Your Personal Goal-Planning Agent

<p align="center">
  <strong>Turn ambitious goals into clear daily actions.</strong><br>
  Plan with purpose. Take the next step. See your progress.
</p>

<p align="center">
  <a href="https://lifepilot-alexa-action-agent.vercel.app/"><strong>🚀 Live Demo</strong></a>
  &nbsp; · &nbsp;
  <a href="https://lifepilot-alexa-action-agent.vercel.app/api/mcp"><strong>🔌 MCP Endpoint</strong></a>
  &nbsp; · &nbsp;
  <a href="https://github.com/madupojumounika/lifepilot-alexa-action-agent"><strong>💻 Source Code</strong></a>
</p>

<p align="center">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=222">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Serverless-339933?logo=nodedotjs&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white">
  <img alt="MCP" src="https://img.shields.io/badge/AI%20Integration-MCP-6C5CE7">
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel&logoColor=white">
</p>

<p align="center"><strong>Amazon Developer Hackathon 2026 · Alexa+ Track</strong></p>

---

## ✨ Overview

**LifePilot** is a goal-planning and productivity web app that helps people turn a broad ambition into a practical seven-day roadmap. It brings conversational guidance, a persistent personal workspace, progress tracking, and a self-hosted **Model Context Protocol (MCP)** server into one project.

Instead of leaving users with a long list of ideas, LifePilot helps them define a goal, review a structured plan, work through individual tasks, and return to their progress whenever they need to.

### Why LifePilot?

- **Make goals actionable:** Break a goal into manageable day-by-day steps.
- **Keep the user in control:** Review and approve a proposed roadmap before tracking it.
- **Build momentum:** Mark tasks complete or reopen them as plans evolve.
- **Keep work organized:** Save multiple roadmaps and return to earlier plans from history.
- **Explore conversational interaction:** Use the LifePilot Voice interface with browser-supported voice input and spoken responses.
- **Connect through MCP:** Expose reusable planning and progress tools to compatible MCP clients.

## 🚀 Features

### Goal planning and task management
- Generate structured seven-day roadmaps for goals such as interview preparation, hackathons, exams, job searches, software projects, and personal goals.
- Review a roadmap before approving it.
- Track individual tasks with clear completion states.
- Mark tasks complete and reopen them when priorities change.
- View progress metrics for saved plans.

### Personal workspace and roadmap history
- Create an account and sign in with email and password.
- Persist roadmaps and task updates in PostgreSQL.
- View saved roadmaps, creation dates, task counts, and completion progress.
- Reopen a previous roadmap and continue where you left off.
- **Delete a roadmap from history**, including its associated saved tasks.
- Keep roadmap history scoped to the signed-in account.

### LifePilot Voice
- Use an assistant-style conversation panel to describe a goal.
- Start with guided prompts or enter a custom request.
- View roadmap suggestions and ask for the next unfinished action.
- Calculate progress from task statuses.
- Use browser speech recognition and speech synthesis where supported by the browser and device.
- Send a proposed goal into the main workspace for review.

### Self-hosted MCP server
LifePilot provides an MCP endpoint over **Streamable HTTP**, using the official TypeScript MCP SDK.

| Tool / Resource | What it does |
|---|---|
| `generate_goal_roadmap` | Creates a proposed seven-day roadmap from a supplied goal. |
| `recommend_next_action` | Suggests the next unfinished action using the goal and completed day numbers supplied by the caller. |
| `calculate_plan_progress` | Calculates task-status totals and completion percentage from supplied statuses. |
| `lifepilot://capabilities` | Describes the server's available capabilities. |

The MCP tools are designed as reusable planning utilities. The web workspace separately manages each signed-in user's saved roadmaps and task progress.

## 🧭 How It Works

1. **Define a goal** — Enter the outcome you want to achieve.
2. **Create a roadmap** — LifePilot prepares a structured seven-day plan using goal-specific templates.
3. **Review and approve** — Decide whether the proposed steps fit your needs.
4. **Take action** — Work through the roadmap and update task statuses.
5. **Track progress** — See completed work and remaining tasks.
6. **Return anytime** — Open a saved roadmap from history or remove one you no longer need.
7. **Connect with MCP** — Use the planning tools from a compatible MCP client.

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────┐
│                    Web Browser                      │
│              HTML · CSS · JavaScript                │
│                                                    │
│   Goal Planning · LifePilot Voice · History         │
│   Approval · Task Tracking · Progress Metrics       │
└─────────────────────────┬──────────────────────────┘
                          │ HTTPS / JSON
                          ▼
┌────────────────────────────────────────────────────┐
│              Vercel Serverless API                  │
│                                                    │
│   /api/auth     /api/plan     /api/task              │
│   /api/history  /api/mcp                            │
└───────────────┬──────────────────────┬──────────────┘
                │                      │
                ▼                      ▼
┌────────────────────────┐  ┌────────────────────────┐
│     Neon PostgreSQL    │  │     MCP Server          │
│                        │  │  Streamable HTTP        │
│ Accounts · Roadmaps     │  │  Roadmap generation     │
│ Tasks · Task statuses  │  │  Next-action guidance   │
│ Persistent history     │  │  Progress calculation   │
└────────────────────────┘  └────────────┬───────────┘
                                         │
                                         ▼
                                Compatible MCP Clients
```

## 🧰 Technology Stack

| Area | Technologies |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Vercel Serverless Functions |
| Database | PostgreSQL, Neon |
| Database driver | `pg` |
| MCP integration | `@modelcontextprotocol/sdk`, Streamable HTTP |
| Input validation | Zod |
| Voice experience | Browser speech recognition and speech synthesis |
| Deployment | Vercel |
| Agent instructions | Portable Markdown skill |

## 🔗 Live Links

- **Application:** https://lifepilot-alexa-action-agent.vercel.app/
- **MCP endpoint:** https://lifepilot-alexa-action-agent.vercel.app/api/mcp
- **Repository:** https://github.com/madupojumounika/lifepilot-alexa-action-agent

The MCP URL is intended for MCP-compatible clients rather than as a standard browser page.

## 🧪 Try the MCP Tools

Connect [MCP Inspector](https://github.com/modelcontextprotocol/inspector) or another compatible client to:

```text
https://lifepilot-alexa-action-agent.vercel.app/api/mcp
```

Example tool inputs:

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

## 💻 Run Locally

### Prerequisites
- Node.js 20 or later
- A PostgreSQL database (for example, a Neon project)
- Git
- Vercel CLI

### 1. Clone and install

```bash
git clone https://github.com/madupojumounika/lifepilot-alexa-action-agent.git
cd lifepilot-alexa-action-agent
git checkout production
npm install
```

### 2. Set up the database

Create a PostgreSQL database and run the SQL in `vercel-schema.sql` using your database SQL editor. Run `auth-migration.sql` to configure account authentication.

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
DATABASE_URL=your_postgresql_connection_string
```

Use your own database connection string. Keep credentials private and never commit them to source control.

### 4. Start the application

```bash
npx vercel dev
```

Open the local URL printed by Vercel.

## 🗺️ API Routes

| Route | Purpose |
|---|---|
| `/api/auth` | Account signup, login, logout, and session checks |
| `/api/plan` | Create and retrieve a signed-in user's roadmaps |
| `/api/task` | Approve plans and update task status |
| `/api/history` | Retrieve roadmap history and delete a selected roadmap with its saved tasks |
| `/api/mcp` | MCP tools and the capabilities resource |

## 🔐 Security and Data Handling

- Roadmap and task operations are scoped to the authenticated user's account.
- Passwords are stored using scrypt hashing.
- Session cookies use HTTP-only and SameSite settings.
- Database credentials belong in environment variables, not in source code.
- MCP planning tools process the input supplied by the caller and are separate from the private web-workspace data.

## 🎬 Demo Walkthrough

For a concise project demonstration:

1. Open the live app and create an account or sign in.
2. Enter a goal and generate a seven-day roadmap.
3. Review and approve the roadmap.
4. Complete a task and show the updated progress.
5. Refresh the page to demonstrate persistence.
6. Open History and reopen a saved roadmap.
7. Delete a selected roadmap to demonstrate history management.
8. Open LifePilot Voice and demonstrate roadmap or next-action guidance.
9. Connect MCP Inspector to the MCP endpoint and show the available tools and resource.

For voice input, use a browser and device that support speech recognition and grant microphone permission when prompted.

## 📁 Agent Skill

Portable agent-skill instructions are available at:

[`skills/lifepilot-goal-planning/SKILL.md`](skills/lifepilot-goal-planning/SKILL.md)

The skill describes how a compatible agent can request a roadmap, present it as a proposal, recommend a next action, and calculate progress.

## 📄 License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).

---

<p align="center"><strong>LifePilot — Make room for progress.</strong><br>Built for the Amazon Developer Hackathon 2026 · Alexa+ Track</p>
