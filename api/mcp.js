import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export const config = { runtime: "nodejs" };

function tasksFor(goal) {
  const g = goal.toLowerCase();
  if (/interview|software|sde|coding/.test(g)) return [
    ["Set your target role and interview format", "Strategy", 35],
    ["Review arrays, strings, and hash maps; solve 3 problems", "Core skills", 90],
    ["Practice binary search and two pointers", "Core skills", 100],
    ["Revise OOP, collections, SQL, and system-design basics", "Fundamentals", 90],
    ["Complete a timed coding mock and review mistakes", "Mock interview", 100],
    ["Practice behavioral stories", "Communication", 60],
    ["Run a final mock and prepare interviewer questions", "Final review", 100]
  ];
  if (/hackathon|competition|demo day/.test(g)) return [
    ["Define the problem, target user, and judging-track fit", "Strategy", 35],
    ["Build the core end-to-end workflow", "Build", 100],
    ["Add validation and useful error states", "Reliability", 75],
    ["Test the main workflow and fix blockers", "QA", 90],
    ["Publish the source with license and setup instructions", "Open source", 60],
    ["Record a concise working demo", "Demo", 60],
    ["Verify submission links and requirements", "Submission", 45]
  ];
  if (/exam|study|syllabus|semester/.test(g)) return [
    ["List the syllabus and exam format", "Strategy", 35],
    ["Study a high-priority topic using active recall", "Learning", 90],
    ["Solve practice questions without notes", "Practice", 90],
    ["Review mistakes and weak topics", "Review", 40],
    ["Study the next topic and explain it aloud", "Learning", 90],
    ["Take a timed mini-mock", "Mock test", 90],
    ["Revise weak areas and prepare a checklist", "Final review", 60]
  ];
  if (/job|internship|resume|career/.test(g)) return [
    ["Choose target roles and identify required skills", "Strategy", 40],
    ["Tailor your resume with truthful project evidence", "Resume", 75],
    ["Polish one portfolio project", "Portfolio", 90],
    ["Apply to relevant roles and track applications", "Applications", 60],
    ["Send personalised professional outreach", "Networking", 45],
    ["Practice technical and behavioral questions", "Interview prep", 90],
    ["Review responses and plan the next application batch", "Review", 35]
  ];
  return [
    ["Define success and list constraints", "Strategy", 35],
    ["Break the goal into three milestones", "Planning", 45],
    ["Complete the first focused work session", "Deep work", 60],
    ["Review progress and remove the biggest blocker", "Review", 30],
    ["Complete the next milestone", "Execution", 60],
    ["Check progress against the original goal", "Validation", 45],
    ["Review the outcome and plan next steps", "Reflection", 35]
  ];
}

const output = value => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });

function createServer() {
  const server = new McpServer({ name: "lifepilot-action-agent", version: "1.1.0" });
  server.registerTool("generate_goal_roadmap", {
    title: "Generate a seven-day LifePilot roadmap",
    description: "Generate a proposed seven-day roadmap from a goal. Uses deterministic templates, not a live AI model. Does not execute tasks or save data.",
    inputSchema: { goal: z.string().trim().min(8).max(600), startDate: z.string().optional() }
  }, async ({ goal, startDate }) => {
    const date = startDate || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      return { ...output({ error: "startDate must be a valid YYYY-MM-DD date." }), isError: true };
    }
    const tasks = tasksFor(goal.trim()).map(([title, category, durationMinutes], i) => {
      const day = new Date(date + "T00:00:00.000Z");
      day.setUTCDate(day.getUTCDate() + i);
      return { day: i + 1, date: day.toISOString().slice(0, 10), title, category, durationMinutes, status: "pending" };
    });
    return output({ product: "LifePilot — AI Action Agent", goal: goal.trim(), startDate: date, generationMode: "deterministic goal-specific template", requiresHumanApproval: true, tasks });
  });

  server.registerTool("recommend_next_action", {
    title: "Recommend the next action",
    description: "Return the next unfinished task based on supplied completed day numbers. This recommendation does not change task state.",
    inputSchema: { goal: z.string().trim().min(8).max(600), completedDays: z.array(z.number().int().min(1).max(7)).max(7).default([]) }
  }, async ({ goal, completedDays }) => {
    const tasks = tasksFor(goal).map(([title, category, durationMinutes], i) => ({ day: i + 1, title, category, durationMinutes }));
    const completed = new Set(completedDays);
    const nextAction = tasks.find(task => !completed.has(task.day)) || null;
    return output({ goal, completedDays: [...completed].sort((a, b) => a - b), progressPercent: Math.round(completed.size / 7 * 100), nextAction });
  });

  server.registerTool("calculate_plan_progress", {
    title: "Calculate task progress",
    description: "Calculate completion totals from task statuses supplied by the caller. Does not read or modify user data.",
    inputSchema: { statuses: z.array(z.enum(["pending", "approved", "done"])).min(1).max(100) }
  }, async ({ statuses }) => {
    const done = statuses.filter(s => s === "done").length;
    return output({ total: statuses.length, done, approved: statuses.filter(s => s === "approved").length, pending: statuses.filter(s => s === "pending").length, completionPercent: Math.round(done / statuses.length * 100) });
  });

  server.registerResource("lifepilot-capabilities", "lifepilot://capabilities", {
    title: "LifePilot capabilities and limitations",
    description: "Describes current prototype capabilities and integrations.",
    mimeType: "application/json"
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({
    product: "LifePilot — AI Action Agent",
    features: ["seven-day goal roadmaps", "human review before action", "next-action recommendations", "progress calculations"],
    planningEngine: "deterministic goal-specific templates",
    transport: "MCP Streamable HTTP",
    officialAlexaPlusIntegration: false,
    amazonBedrockIntegration: false,
    note: "Independent MCP-enabled prototype; not connected to an Alexa device or official Alexa+ service."
  }, null, 2) }] }));

  return server;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization, mcp-session-id, mcp-protocol-version, last-event-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id, mcp-protocol-version");
  if (req.method === "OPTIONS") return res.status(204).end();

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("LifePilot MCP request failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "LifePilot MCP server encountered an unexpected error." });
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
