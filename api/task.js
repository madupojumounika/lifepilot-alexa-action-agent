import { db } from "hatchable";

export const access = "public";
export const methods = ["POST"];

export default async function(req, res) {
  const taskId = String(req.body?.taskId || "");
  const action = String(req.body?.action || "");
  if (!taskId) return res.status(400).json({ error: "A task ID is required." });

  if (action === "approve_all") {
    const { rows: plans } = await db.query("SELECT id FROM lifepilot_plans ORDER BY created_at DESC LIMIT 1");
    if (!plans.length) return res.status(404).json({ error: "Create a plan first." });
    const { rows: tasks } = await db.query("UPDATE lifepilot_tasks SET status = 'approved' WHERE plan_id = $1 AND status = 'pending' RETURNING id, plan_id, title, day_index, category, duration_minutes, status", [plans[0].id]);
    const { rows: allTasks } = await db.query("SELECT id, plan_id, title, day_index, category, duration_minutes, status FROM lifepilot_tasks WHERE plan_id = $1 ORDER BY day_index ASC", [plans[0].id]);
    return res.json({ tasks: allTasks, approvedCount: tasks.length, message: "Plan approved. You can now mark actions complete as you do them." });
  }

  if (action === "complete") {
    const { rows: existing } = await db.query("SELECT id, status FROM lifepilot_tasks WHERE id = $1 LIMIT 1", [taskId]);
    if (!existing.length) return res.status(404).json({ error: "Task not found." });
    if (existing[0].status === "pending") return res.status(409).json({ error: "Approve the plan before completing a task." });
    const { rows } = await db.query("UPDATE lifepilot_tasks SET status = 'done' WHERE id = $1 RETURNING id, plan_id, title, day_index, category, duration_minutes, status", [taskId]);
    return res.json({ task: rows[0], message: "Completion recorded and verified in the task store." });
  }

  if (action === "reopen") {
    const { rows } = await db.query("UPDATE lifepilot_tasks SET status = 'approved' WHERE id = $1 AND status = 'done' RETURNING id, plan_id, title, day_index, category, duration_minutes, status", [taskId]);
    if (!rows.length) return res.status(404).json({ error: "Completed task not found." });
    return res.json({ task: rows[0], message: "Task returned to approved status." });
  }

  return res.status(400).json({ error: "Unknown action." });
}