import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getPool } from "./db.js";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "lifepilot_session";
const SESSION_DAYS = 7;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derived = await scrypt(password, salt, 64);
  return { salt, hash: Buffer.from(derived).toString("hex") };
}

export async function verifyPassword(password, salt, expectedHash) {
  const actual = await hashPassword(password, salt);
  const expected = Buffer.from(expectedHash, "hex");
  const candidate = Buffer.from(actual.hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function digestToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(req, name) {
  const raw = req.headers?.cookie || "";
  for (const item of raw.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return item.slice(separator + 1).trim();
  }
  return "";
}

export function setSessionCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`);
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

export async function createSession(userId, res) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = digestToken(token);
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const db = getPool();
  await db.query(
    "INSERT INTO lifepilot_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))",
    [userId, tokenHash, maxAge]
  );
  setSessionCookie(res, token, maxAge);
}

export async function getAuthenticatedUser(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token || token.length > 128) return null;
  const db = getPool();
  const { rows } = await db.query(
    "SELECT u.id, u.email, u.display_name FROM lifepilot_sessions s JOIN lifepilot_users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW() LIMIT 1",
    [digestToken(token)]
  );
  return rows[0] || null;
}

export async function revokeSession(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token || token.length > 128) return;
  await getPool().query("DELETE FROM lifepilot_sessions WHERE token_hash = $1", [digestToken(token)]);
}
