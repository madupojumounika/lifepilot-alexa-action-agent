# Architecture

Browser UI (HTML / CSS / JavaScript)
   | POST /api/plan
   v
Plan API --------------------> PostgreSQL: lifepilot_plans
   | creates seven task rows   PostgreSQL: lifepilot_tasks
   |
Browser UI
   | POST /api/task { action: approve_all }
   v
Task API --------------------> set pending tasks to approved
   |
Browser UI
   | POST /api/task { action: complete, taskId }
   v
Task API --------------------> validate approved status, persist done

## Safety boundary in the demo

- New tasks start as pending.
- Completion requests for pending tasks return a conflict.
- Only an explicit approve_all action changes pending tasks to approved.
- Completion is recorded only after an approved task is marked done.
- The activity log describes these state changes.

## Current implementation limits

- Goal classification and task generation are deterministic templates, not a live LLM.
- The demo is not connected to Amazon Alexa+.
- No external calendar, email, or messaging actions are performed.
- The backend uses Hatchable's database runtime; porting it elsewhere requires adapting the database import and API runtime.