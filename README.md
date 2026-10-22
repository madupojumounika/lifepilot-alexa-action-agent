# LifePilot — Alexa+ Action Agent

LifePilot is an **Alexa+-style web simulation** that turns a user's goal into a visible, reviewable action plan. The demo focuses on one core promise: an assistant should help people make progress while keeping them in control.

## Demo

- App: https://lifepilot-alexa.hatchable.site
- Project status: working web simulation; deployed demo backed by PostgreSQL.

> **Important scope note:** This submission currently simulates an Alexa+-style interaction in a web interface. It is not an official Alexa+ integration, does not run an MCP server, and does not currently call Amazon Bedrock or another live generative AI model. Planning uses a small deterministic demo workflow. Do not describe these integrations as implemented.

## What works

- Create a seven-day goal plan for software interviews, hackathons, exams/study, job searches, software projects, or general goals.
- Capture a goal using browser-native speech recognition where the browser supports it, and hear spoken guidance through speech synthesis.
- Persist the plan and tasks in PostgreSQL.
- Review the proposed tasks before approving the plan.
- Prevent task completion while the plan is pending approval.
- Mark approved tasks complete, reopen completed tasks, and persist each status change.
- Show real local calendar dates for the current seven-day window and the date associated with each task.
- Keep plans isolated by a browser-generated workspace ID so visitors in separate browsers do not overwrite each other's plans (this is workspace separation, not account authentication).
- Restore the latest plan and task statuses after reloading.
- View an activity log that explains the demo's actions.

## User flow

1. Enter a goal and constraints.
2. LifePilot creates seven daily action items.
3. Review the task list and time estimates.
4. Approve the plan explicitly.
5. Mark an approved task complete, then reopen it if needed.
6. Refresh the page and verify the stored state and date labels.

## Architecture

- Responsive HTML/CSS/JavaScript interface.
- Backend endpoints: /api/plan and /api/task.
- PostgreSQL tables: lifepilot_plans and lifepilot_tasks.
- Browser-generated workspace IDs isolate each browser's demo plan and task actions.
- SQL migrations are in migrations.

Workspace IDs provide demo-session separation, not account authentication. Do not store sensitive personal data in this prototype.

The API uses the Hatchable runtime's hatchable database module in the deployed environment. The backend files are not a standalone Express app without adapting that database/runtime integration.

## Run the demo

Open the live URL, enter a goal, create the plan, approve it, and mark one action complete. Refresh the page to demonstrate persistence. The app does not access your calendar, send messages, or execute external actions.

## Hackathon demo outline (under 3 minutes)

- 0:00–0:20 — State the problem: assistants often produce suggestions without a transparent action workflow.
- 0:20–0:50 — Enter a realistic interview-preparation goal and generate the seven-day plan.
- 0:50–1:20 — Review task categories and estimates, then show that tasks are pending until explicit approval.
- 1:20–1:50 — Approve the plan and complete one task.
- 1:50–2:10 — Refresh and show persisted progress.
- 2:10–2:40 — Explain the approval boundary, activity log, and current simulation scope.
- 2:40–2:55 — Close with next steps: voice interaction, real AI planning, and supported Alexa+/MCP integration.

## Current limitations and next steps

1. Add voice input/output for a more natural assistant-like demo.
2. Replace deterministic task templates with a model-backed planner after credentials and service access are configured.
3. If pursuing the Alexa+ simulation track, clearly document the simulation and include source code in the submission.
4. Add tests and a deployment-specific setup guide before claiming portability outside Hatchable.

## License

This repository is released under the MIT License; see `LICENSE` at the repository root.