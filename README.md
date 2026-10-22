# LifePilot — AI Action Agent

LifePilot is a goal-to-action planning prototype inspired by personal assistant experiences such as Alexa+. It converts a goal into a proposed seven-day roadmap, keeps the user in control through a review step, and tracks task progress in a web interface. It also exposes planning tools through a self-hosted Model Context Protocol (MCP) Streamable HTTP endpoint and includes a portable agent skill that describes how a compatible agent should use those tools.

- **Live application:** https://lifepilot-alexa-action-agent.vercel.app/
- **MCP endpoint:** https://lifepilot-alexa-action-agent.vercel.app/api/mcp
- **Agent skill:** [skills/lifepilot-goal-planning/SKILL.md](skills/lifepilot-goal-planning/SKILL.md)
- **Repository:** https://github.com/madupojumounika/lifepilot-alexa-action-agent
- **Deployment branch:** `production`

## What it does

- **Seven-day planning:** Generate a day-by-day roadmap from a goal.
- **Goal-specific templates:** Includes interview preparation, hackathons, exams, job searches, and general goals.
- **Human approval:** Review a proposed plan before approving tasks.
- **Task tracking:** Mark approved tasks complete or reopen completed tasks.
- **Persistent storage:** Save plans and task updates in PostgreSQL.
- **Personal workspaces:** Email/password signup and login with per-account plan ownership.
- **Voice interaction:** Browser speech recognition and speech synthesis where supported.
- **Activity tracking:** View actions and progress in the workspace.
- **MCP tools:** Let a compatible MCP client request a roadmap, get a next-action recommendation, or calculate progress from supplied statuses.
- **Agent skill:** Provides a reusable goal-planning workflow and safety instructions for compatible agents.

## MCP server

LifePilot exposes an MCP server at `/api/mcp` using the official TypeScript MCP SDK and Streamable HTTP transport. The endpoint exposes these tools:

- `generate_goal_roadmap`: Returns a proposed seven-day roadmap for a goal.
- `recommend_next_action`: Recommends the next unfinished task based on completed day numbers supplied by the caller.
- `calculate_plan_progress`: Calculates totals and completion percentage from task statuses supplied by the caller.

It also exposes the `lifepilot://capabilities` resource describing the prototype's capabilities and limitations.

The MCP tools are currently **planning and calculation tools**. They do not mutate the signed-in user's stored plans, access external services, or execute actions on the user's behalf. They use deterministic, goal-specific templates rather than a live generative AI model. The endpoint is intended for demonstration and does not currently implement OAuth or per-user MCP authorization; do not send private user data to it.

### Try the MCP endpoint

Use a compatible MCP client or MCP Inspector and configure the server URL as:

```text
https://lifepilot-alexa-action-agent.vercel.app/api/mcp
```

Call `generate_goal_roadmap` with a goal such as `Prepare for a software engineering interview`, then inspect the seven-day task list. The endpoint must be deployed before it can be tested remotely.

## Agent skill

The portable skill is located at `skills/lifepilot-goal-planning/SKILL.md`. It tells a compatible agent how to call the MCP tools, present the proposed roadmap, recommend a next step, and calculate progress without claiming actions were executed. The skill file is an instruction bundle; it does not by itself provide a live AI model or connect to Alexa+.

## Important scope note

LifePilot is an independent web prototype inspired by personal assistant experiences. It is **not an official Alexa+ integration** and does not connect to an Alexa device, Amazon Bedrock, or the gated Alexa+ add-on tools. The MCP server provides a standards-based integration surface for compatible MCP clients; it does not itself turn the web app into an Alexa+ device integration.

## Technology

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Vercel serverless API routes on Node.js
- **MCP:** `@modelcontextprotocol/sdk`, Streamable HTTP transport
- **Agent instructions:** Portable `SKILL.md`
- **Database:** PostgreSQL hosted on Neon
- **Database driver:** Node.js `pg` package
- **Validation:** Zod
- **Hosting:** Vercel

## Architecture

```text
Browser
  ├── Frontend: HTML, CSS, JavaScript
  ├── /api/auth ── signup, login, logout, session
  ├── /api/plan ── create and retrieve personal plans
  ├── /api/task ── approve, complete, reopen tasks
  └── /api/mcp ── MCP tools over Streamable HTTP
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    MCP planning tools         Neon PostgreSQL
    (template-based)            (web app data)
```

The MCP tools intentionally do not write to the user's database. Existing web-app plan/task operations use authenticated account ownership.

## Run locally

Requirements: Node.js 20+, a PostgreSQL database, and the Vercel CLI.

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/madupojumounika/lifepilot-alexa-action-agent.git
   cd lifepilot-alexa-action-agent
   git checkout production
   npm install
   ```

2. Create a PostgreSQL database and run `vercel-schema.sql` in its SQL editor. For authentication, also run `auth-migration.sql`.

3. Create a private `.env.local` file with your database connection:

   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```

4. Start the local Vercel development server:

   ```bash
   npx vercel dev
   ```

5. Test the web app at the local URL printed by Vercel. The MCP endpoint will be available at `/api/mcp`.

Never commit credentials or database connection strings. If a database connection string is exposed, rotate its password and update the deployment environment variable.

## API endpoints

- `/api/auth`: Account signup, login, logout, and session checks.
- `/api/plan`: Create or retrieve a user's latest plan.
- `/api/task`: Approve a plan, complete a task, or reopen a completed task.
- `/api/mcp`: Stateless MCP endpoint exposing roadmap and progress tools over Streamable HTTP.

## Limitations and future work

- Replace deterministic templates with model-backed planning when a suitable model and credentials are available.
- Add OAuth or another appropriate authorization flow before exposing private account operations through MCP.
- Add automated MCP protocol/integration tests, rate limiting, monitoring, and improved error handling.
- Explore supported Alexa+ integration options when access and requirements permit.
- Improve accessibility and test across more browsers and devices.

## Demo checklist

1. Open the [live application](https://lifepilot-alexa-action-agent.vercel.app/).
2. Sign in, create a goal-based roadmap, and review it.
3. Approve the plan, complete a task, and reopen it.
4. Refresh the app to demonstrate persistence.
5. Demonstrate the MCP endpoint using a compatible MCP client and call `generate_goal_roadmap`.
6. Explain that the web app persists user plans, while the MCP tools currently provide template-based planning and calculations only.

## License

MIT License. See [LICENSE](LICENSE).
