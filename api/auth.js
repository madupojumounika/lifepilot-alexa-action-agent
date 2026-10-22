import { getPool } from "../lib/db.js";
import { clearSessionCookie, createSession, getAuthenticatedUser, hashPassword, normalizeEmail, revokeSession, validEmail, verifyPassword } from "../lib/auth.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Cookie");
  try {
    if (req.method === "GET") {
      const user = await getAuthenticatedUser(req);
      if (!user) return res.status(200).json({ user: null });
      return res.status(200).json({ user });
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed." });
    }
    const action = String(req.body?.action || "");
    const db = getPool();

    if (action === "signup") {
      const displayName = String(req.body?.name || "").trim().slice(0, 80);
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      if (displayName.length < 2) return res.status(400).json({ error: "Enter your name (at least 2 characters)." });
      if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
      if (password.length < 10 || password.length > 128) return res.status(400).json({ error: "Use a password between 10 and 128 characters." });
      const { salt, hash } = await hashPassword(password);
      let rows;
      try {
        ({ rows } = await db.query(
          "INSERT INTO lifepilot_users (email, display_name, password_salt, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name",
          [email, displayName, salt, hash]
        ));
      } catch (error) {
        if (error.code === "23505") return res.status(409).json({ error: "An account with that email already exists. Please log in." });
        throw error;
      }
      await createSession(rows[0].id, res);
      return res.status(201).json({ user: rows[0], message: "Account created. Welcome to LifePilot." });
    }

    if (action === "login") {
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      if (!validEmail(email) || !password || password.length > 128) return res.status(400).json({ error: "Enter your email and password." });
      const { rows } = await db.query(
        "SELECT id, email, display_name, password_salt, password_hash FROM lifepilot_users WHERE email = $1 LIMIT 1",
        [email]
      );
      const user = rows[0];
      if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
        return res.status(401).json({ error: "Email or password is incorrect." });
      }
      await createSession(user.id, res);
      return res.status(200).json({ user: { id: user.id, email: user.email, display_name: user.display_name }, message: "You're signed in." });
    }

    if (action === "logout") {
      await revokeSession(req);
      clearSessionCookie(res);
      return res.status(200).json({ user: null, message: "You've signed out." });
    }

    return res.status(400).json({ error: "Unknown authentication action." });
  } catch (error) {
    console.error("LifePilot authentication failed:", error);
    return res.status(500).json({ error: "Authentication is temporarily unavailable. Please try again." });
  }
}
