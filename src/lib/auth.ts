import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET =
  process.env.AUTH_SECRET || "sportsfest-dev-secret-change-me-in-production-2025";
const COOKIE_NAME = "sf_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ── Password hashing (Node built-in scrypt) ── */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  // constant-time compare
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(verify, "hex")
  );
}

/* ── Signed token (HMAC) ── */
export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  try {
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString()) as TokenPayload;
  } catch {
    return null;
  }
}

/* ── Cookie helpers (server-side) ── */
export async function setSessionCookie(payload: TokenPayload) {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const payload = await getSession();
  if (!payload) return null;
  return payload;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
