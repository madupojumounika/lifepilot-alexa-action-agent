# LifePilot — Alexa+ Action Agent

**LifePilot is a goal-to-action planning prototype inspired by assistant experiences such as Alexa+.** It converts a user's goal into a structured seven-day plan, asks for approval before tasks can be completed, and tracks progress in a simple web interface.

- **Live application:** https://lifepilot-alexa-action-agent.vercel.app/
- **Repository:** https://github.com/madupojumounika/lifepilot-alexa-action-agent
- **Deployment branch:** `production`

## Overview

Many productivity tools produce suggestions but leave users to decide how to turn them into manageable steps. LifePilot demonstrates a transparent workflow: describe a goal, review a proposed plan, approve it, and track progress as tasks are completed.

This repository contains a web prototype. It is **not an official Alexa+ integration** and does not currently connect to an Alexa device, execute external actions, run an MCP server, or use Amazon Bedrock or another live generative AI model. Plan generation currently uses deterministic goal templates.

## Features

- **Seven-day planning:** Generate a day-by-day action plan from a goal.
- **Goal-specific templates:** Includes workflows for interview preparation, hackathons, exams and study, job searches, software projects, and general goals.
- **Human approval step:** Review the plan before approving tasks.
- **Task progress:** Approve the plan, mark approved tasks complete, and reopen completed tasks.
- **Persistent storage:** Save plans and task states in PostgreSQL.
- **Date-aware plans:** Display calendar dates for the plan's seven-day window.
- **Voice interaction:** Use browser speech recognition and speech synthesis where supported by the browser and device.
- **Activity history:** Show key actions taken in the current workspace.
- **Workspace separation:** Use a browser-generated workspace ID to keep different browser sessions' plans separate. This is not user authentication.

## How it works

1. Enter a goal.
2. LifePilot selects a matching deterministic template and creates seven daily tasks.
3. Review the tasks and estimated durations.
4. Explicitly approve the plan.
5. Mark approved tasks complete as you make progress, or reopen a completed task.
6. Refresh the application to check that the plan and task states persist.

The application does not access a user's calendar, send messages, or perform actions in external services.

## Technology

- **Frontend:** HTML, CSS, and vanilla JavaScript
- **Backend:** Vercel serverless API routes
- **Database:** PostgreSQL hosted on Neon
- **Hosting:** Vercel
- **Database driver:** Node.js `pg` package

## Architecture

```text
Browser
  ├── Static frontend: index.html, styles.css, app.js
  ├── POST /api/plan  ── create and retrieve plans
  └── POST /api/task  ── approve, complete, or reopen tasks
                         │
                         ▼
                  Vercel API routes
                         │
                         ▼
                    Neon PostgreSQL
                    ├── lifepilot_plans
                    └── lifepilot_tasks
```

The browser creates a UUID to identify its workspace. This ID is used to scope plan and task operations, but it is **not an authentication or authorization system**. Do not store sensitive personal information in this prototype.

## Local development

### Requirements

- Node.js 20 or later
- A PostgreSQL database
- A Vercel account for deployment and local Vercel CLI workflows

### Setup

1. Clone the repository and switch to the deployment branch:

   ```bash
   git clone https://github.com/madupojumounika/lifepilot-alexa-action-agent.git
   cd lifepilot-alexa-action-agent
   git checkout production
   npm install
   ```

2. Create a PostgreSQL database (for example, using Neon).

3. Run the schema in the database's SQL editor:

   `vercel-schema.sql`

4. Configure the database connection as an environment variable. For local development, create a `.env.local` file:

   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```

   Replace the placeholder with your own connection string. Never commit credentials, `.env.local`, or other secrets to Git.

5. Run the application locally with the Vercel CLI:

   ```bash
   npx vercel dev
   ```

   If prompted, link the local project to your Vercel project. Keep `.env.local` private.

## Deployment

The production frontend and API are deployed on Vercel from the `production` branch.

To deploy your own instance:

1. Import this GitHub repository into Vercel and select `production` as the production branch.
2. Create a PostgreSQL database and execute `vercel-schema.sql` against it.
3. Add `DATABASE_URL` to the Vercel project's Environment Variables. Set it for Production and any other environments you intend to use.
4. Deploy or redeploy the project.
5. Open the deployed URL and test plan creation, approval, task completion, reopening, and persistence after refresh.

Never put the database connection string in source code or expose it in screenshots, logs, or public issues. If a connection string is exposed, rotate the database password and update the environment variable.

## API endpoints

### `/api/plan`

Creates a seven-day plan and retrieves the latest plan for the supplied browser workspace. The API validates the goal, date, and workspace ID and stores the plan and its tasks in PostgreSQL.

### `/api/task`

Supports plan approval and task state changes. Operations are scoped to the supplied workspace ID. Supported actions include `approve_all`, `complete`, and `reopen`.

## Limitations and future work

- Replace deterministic templates with model-backed planning when a suitable model and credentials are configured.
- Add real user authentication and authorization before using this for private or sensitive data.
- Add automated integration tests and broader browser/device testing.
- Integrate with supported Alexa+/MCP capabilities only if the chosen platform and hackathon requirements permit it.
- Improve accessibility, observability, and error recovery as the prototype evolves.

## Demo checklist

For a short walkthrough:

1. Open the [live application](https://lifepilot-alexa-action-agent.vercel.app/).
2. Enter a realistic goal and generate the plan.
3. Review the proposed tasks and approve the plan.
4. Complete one task, then reopen it.
5. Refresh the page to demonstrate persistence.
6. Explain the human-approval step and clearly state that planning is currently template-based.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
