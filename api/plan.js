import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "POST"];

const makeTasks = (goal) => {
  const g = String(goal || "").toLowerCase();
  if (g.includes("interview") || g.includes("software") || g.includes("sde") || g.includes("coding")) {
    return [
      ["Set your target role and map the interview format", "Strategy", 35],
      ["Review arrays, strings, and hash maps; solve 3 focused problems", "Core skills", 90],
      ["Practice binary search and two-pointer patterns; explain complexity aloud", "Core skills", 100],
      ["Revise OOP, collections, SQL, and one system-design foundation", "Fundamentals", 90],
      ["Complete a timed coding mock and write down every mistake", "Mock interview", 100],
      ["Practice behavioral stories using situation, action, and result", "Communication", 60],
      ["Run a final mock, review weak spots, and prepare questions for the interviewer", "Final review", 100]
    ];
  }
  if (g.includes("hackathon") || g.includes("demo day") || g.includes("competition")) {
    return [
      ["Lock the problem statement, target user, and judging-track fit", "Strategy", 35],
      ["Build the single end-to-end workflow that proves the core idea", "Build", 100],
      ["Add input validation, useful empty states, and clear success/error feedback", "Reliability", 75],
      ["Test the main workflow from a fresh session and fix the top blockers", "QA", 90],
      ["Publish the source repository with a license and clear setup instructions", "Open source", 60],
      ["Record a concise demo showing the product working, not just slides", "Demo", 60],
      ["Verify every submission field, links, track eligibility, and final deadline", "Submission", 45]
    ];
  }
  if (g.includes("exam") || g.includes("study") || g.includes("syllabus") || g.includes("semester")) {
    return [
      ["List the syllabus, exam format, and marks distribution", "Strategy", 35],
      ["Study the highest-weight topic using active recall", "Learning", 90],
      ["Solve practice questions without looking at the notes", "Practice", 90],
      ["Review mistakes and create a short weak-topic list", "Review", 40],
      ["Study the next high-priority topic and explain it aloud", "Learning", 90],
      ["Take a timed mini-mock and analyse the result", "Mock test", 90],
      ["Revise the weak areas and prepare an exam-day checklist", "Final review", 60]
    ];
  }
  if (g.includes("job") || g.includes("internship") || g.includes("resume") || g.includes("career")) {
    return [
      ["Choose target roles and list the skills they repeatedly require", "Strategy", 40],
      ["Tailor your resume with measurable, truthful project evidence", "Resume", 75],
      ["Polish one portfolio project and verify its live demo and README", "Portfolio", 90],
      ["Apply to a small batch of relevant roles and track each application", "Applications", 60],
      ["Send concise, personalised outreach to relevant employees or alumni", "Networking", 45],
      ["Practice one technical mock and one behavioural story", "Interview prep", 90],
      ["Review response rates and plan the next application batch", "Review", 35]
    ];
  }
  if (g.includes("project") || g.includes("website") || g.includes("app") || g.includes("launch") || g.includes("product")) {
    return [
      ["Define the target user, core problem, and one measurable success metric", "Product", 35],
      ["Build the primary user journey end to end", "Build", 100],
      ["Add validation, loading states, and clear error handling", "Reliability", 75],
      ["Test the journey on desktop and mobile; fix the highest-impact bugs", "QA", 75],
      ["Write a clear README with setup, features, limitations, and screenshots", "Documentation", 45],
      ["Deploy the project and test the public link in a fresh browser session", "Release", 60],
      ["Collect feedback and prioritise the next three improvements", "Iteration", 35]
    ];
  }
  return [
    ["Define what success looks like and list your constraints", "Strategy", 35],
    ["Break the goal into the three most important milestones", "Planning", 45],
    ["Complete the first focused work session", "Deep work", 60],
    ["Review progress and remove the biggest blocker", "Review", 30],
    ["Complete the next milestone and capture what you learned", "Execution", 60],
    ["Test your progress against the original goal", "Validation", 45],
    ["Review the outcome and create your next-step plan", "Reflection", 35]
  ];
};

export default async function(req, res) {
  const sessionId = String((req.method === "GET" ? req.query?.sessionId : req.body?.sessionId) || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) return res.status(400).json({ error: "A valid browser session is required. Refresh the page and try again." });
  if (req.method === "GET") {
    const { rows: plans } = await db.query("SELECT id, goal, start_date, created_at FROM lifepilot_plans WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1", [sessionId]);
    if (!plans.length) return res.json({ plan: null, tasks: [] });
    const plan = plans[0];
    const { rows: tasks } = await db.query("SELECT id, plan_id, title, day_index, category, duration_minutes, status, created_at FROM lifepilot_tasks WHERE plan_id = $1 ORDER BY day_index ASC", [plan.id]);
    return res.json({ plan, tasks });
  }
  const goal = String(req.body?.goal || "").trim();
  if (goal.length < 8) return res.status(400).json({ error: "Tell me a little more about the goal (at least 8 characters)." });
  if (goal.length > 600) return res.status(400).json({ error: "Please keep the goal under 600 characters." });
  const startDate = String(req.body?.startDate || "");
  const parsedStartDate = new Date(startDate + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(parsedStartDate.getTime()) || parsedStartDate.toISOString().slice(0, 10) !== startDate) return res.status(400).json({ error: "Please choose a valid calendar date." });
  const { rows: planRows } = await db.query("INSERT INTO lifepilot_plans (goal, start_date, session_id) VALUES ($1, $2::date, $3) RETURNING id, goal, start_date, created_at", [goal, startDate, sessionId]);
  const plan = planRows[0];
  const taskDefs = makeTasks(goal);
  const tasks = [];
  for (let i = 0; i < taskDefs.length; i++) {
    const [title, category, duration] = taskDefs[i];
    const { rows } = await db.query("INSERT INTO lifepilot_tasks (plan_id, title, day_index, category, duration_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING id, plan_id, title, day_index, category, duration_minutes, status, created_at", [plan.id, title, i + 1, category, duration]);
    tasks.push(rows[0]);
  }
  return res.status(201).json({ plan, tasks, message: "Your plan is ready for review. No tasks have been approved or executed." });
}