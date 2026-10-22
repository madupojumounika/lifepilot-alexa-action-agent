import { getPool } from "../lib/db.js";

export const config = { runtime: "nodejs" };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const taskId = String(req.body?.taskId || "").trim();
  const action = String(req.body?.action || "").trim();
  const sessionId = String(req.body?.sessionId || "").trim();
  if (!UUID_V4.test(sessionId)) return res.status(400).json({ error: "A valid browser session is required. Refresh the page and try again." });
  if (action !== "approve_all" && action !== "complete" && action !== "reopen") return res.status(400).json({ error: "Unknown action." });
  if (action !== "approve_all" && !UUID_V4.test(taskId)) return res.status(400).json({ error: "Invalid task ID." });

  try {
    const db = getPool();
    if (action === "approve_all") {
      const { rows: plans } = await db.query("SELECT id FROM lifepilot_plans WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1", [sessionId]);
      if (!plans.length) return res.status(404).json({ error: "Create a plan first." });
      const { rows: changed } = await db.query(
        "UPDATE lifepilot_tasks SET status = 'approved' WHERE plan_id = $1 AND status = 'pending' RETURNING id",
        [plans[0].id]
      );
      const { rows: tasks } = await db.query(
        "SELECT id, plan_id, title, day_index, category, duration_minutes, status FROM lifepilot_tasks WHERE plan_id = $1 ORDER BY day_index ASC",
        [plans[0].id]
      );
      return res.status(200).json({ tasks, approvedCount: changed.length, message: "Plan approved. You can now mark actions complete as you do them." });
    }

    const { rows: existing } = await db.query(
      "SELECT t.id, t.status FROM lifepilot_tasks t JOIN lifepilot_plans p ON p.id = t.plan_id WHERE t.id = $1 AND p.session_id = $2 LIMIT 1",
      [taskId, sessionId]
    );
    if (!existing.length) return res.status(404).json({ error: "Task not found in this workspace." });

    if (action === "complete") {
      if (existing[0].status === "pending") return res.status(409).json({ error: "Approve the plan before completing a task." });
      const { rows } = await db.query(
        "UPDATE lifepilot_tasks SET status = 'done' WHERE id = $1 AND plan_id IN (SELECT id FROM lifepilot_plans WHERE session_id = $2) RETURNING id, plan_id, title, day_index, category, duration_minutes, status",
        [taskId, sessionId]
      );
      if (!rows.length) return res.status(404).json({ error: "Task not found in this workspace." });
      return res.status(200).json({ task: rows[0], message: "Completion recorded and verified in the task store." });
    }

    const { rows } = await db.query(
      "UPDATE lifepilot_tasks SET status = 'approved' WHERE id = $1 AND status = 'done' AND plan_id IN (SELECT id FROM lifepilot_plans WHERE session_id = $2) RETURNING id, plan_id, title, day_index, category, duration_minutes, status",
      [taskId, sessionId]
    );
    if (!rows.length) return res.status(404).json({ error: "Completed task not found in this workspace." });
    return res.status(200).json({ task: rows[0], message: "Task returned to approved status." });
  } catch (error) {
    console.error("LifePilot /api/task failed:", error);
    return res.status(500).json({ error: "The task service is temporarily unavailable. Check the database connection and try again." });
  }
}
