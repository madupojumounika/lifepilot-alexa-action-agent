import { getPool } from "../lib/db.js";
import { getAuthenticatedUser } from "../lib/auth.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Cookie");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please log in to view your roadmap history." });
    const db = getPool();
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
