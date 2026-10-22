---
name: lifepilot-goal-planning
description: Turn a user's goal into a reviewable seven-day action roadmap using the LifePilot MCP server, recommend the next unfinished action, and calculate task progress. Use when the user wants help planning a goal, preparing for interviews or exams, organizing a hackathon, or tracking a short roadmap.
---

# LifePilot Goal Planning Skill

Use the LifePilot MCP server at `https://lifepilot-alexa-action-agent.vercel.app/api/mcp` when it is available to the connected MCP client.

## Workflow

1. Ask a brief clarifying question only if the goal is too vague to make a useful plan.
2. Call `generate_goal_roadmap` with the user's goal and, when provided, a valid `startDate` in `YYYY-MM-DD` format.
3. Present the seven-day roadmap in readable day-by-day form, including task titles, categories, and estimated minutes.
4. Make clear that the roadmap is a proposal. Ask the user to review it before treating it as their plan.
5. When the user provides completed day numbers, call `recommend_next_action` to identify the next unfinished step.
6. When the user supplies task statuses, call `calculate_plan_progress` to calculate completion totals and percentage.
7. If the MCP server is unavailable, say so and do not claim a tool call succeeded.

## Safety and accuracy

- Never claim a task was completed, a plan was saved, or an external action was taken based on these MCP tools. The current tools generate recommendations and calculations only.
- Do not send passwords, session cookies, API keys, personal records, or other secrets to the MCP endpoint.
- Explain that the current planner uses deterministic goal-specific templates, not a live generative AI model.
- Keep the user in control: recommend actions, but do not imply that they were approved or executed.
- Do not describe LifePilot as an official Alexa+ integration or claim it controls Alexa devices.
