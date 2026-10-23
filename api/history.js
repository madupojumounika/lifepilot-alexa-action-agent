import { getPool } from "../lib/db.js";
import { getAuthenticatedUser } from "../lib/auth.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Cookie");
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please log in to access your roadmap history." });
    const db = getPool();

    if (req.method === "DELETE" || (req.method === "POST" && req.body?.action === "delete")) {
      const planId = String(req.query?.planId || req.body?.planId || "").trim();
      if (!planId || planId.length > 200) return res.status(400).json({ error: "Choose a valid roadmap to delete." });
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const { rows: plans } = await client.query(
          "SELECT id FROM lifepilot_plans WHERE id = $1 AND user_id = $2 FOR UPDATE",
          [planId, user.id]
        );
        if (!plans.length) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "That roadmap was not found in your history." });
        }
        await client.query("DELETE FROM lifepilot_tasks WHERE plan_id = $1", [planId]);
        await client.query("DELETE FROM lifepilot_plans WHERE id = $1 AND user_id = $2", [planId, user.id]);
        await client.query("COMMIT");
        return res.status(200).json({ message: "Roadmap and its saved tasks deleted." });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).json({ error: "Method not allowed." });
    }
    const { rows } = await db.query(
      `SELECT p.id, p.goal, p.start_date, p.created_at,
              COUNT(t.id)::int AS total_tasks,
              COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS completed_tasks,
              COUNT(t.id) FILTER (WHERE t.status = 'approved')::int AS approved_tasks,
              COUNT(t.id) FILTER (WHERE t.status = 'pending')::int AS pending_tasks
       FROM lifepilot_plans p
       LEFT JOIN lifepilot_tasks t ON t.plan_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [user.id]
    );
    const plans = rows.map(plan => ({
      ...plan,
      completion_percent: plan.total_tasks ? Math.round(plan.completed_tasks / plan.total_tasks * 100) : 0,
      status: plan.total_tasks > 0 && plan.completed_tasks === plan.total_tasks ? "completed" : "in_progress"
    }));
    return res.status(200).json({
      plans,
      summary: {
        totalRoadmaps: plans.length,
        completedRoadmaps: plans.filter(plan => plan.status === "completed").length,
        inProgressRoadmaps: plans.filter(plan => plan.status !== "completed").length
      }
    });
  } catch (error) {
    console.error("LifePilot /api/history failed:", error);
    return res.status(500).json({ error: "Roadmap history is temporarily unavailable. Please try again." });
  }
}
