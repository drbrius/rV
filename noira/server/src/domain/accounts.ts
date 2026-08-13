/* ============================================================
   Konten, Sitzungen, Anmeldeschutz
   ============================================================ */

import { all, one, run } from "../db/index.js";
import { hashToken, newId, newToken } from "../lib/ids.js";
import { hashPassword, needsRehash, verifyPassword } from "../lib/password.js";
import { conflict, nowIso, plusDays, tooMany, unauthorized } from "../lib/http.js";

export type Account = {
  id: string;
  email: string;
  password_hash: string;
  role: "advertiser" | "moderator" | "admin";
  locale: string;
  created_at: string;
  updated_at: string;
  disabled_at: string | null;
  disabled_reason: string | null;
};

const SESSION_DAYS = 30;

/* Sperren nach zu vielen Fehlversuchen. Getrennt gezählt je Konto
   und je Herkunft: Sonst legt ein Angriff auf ein einzelnes Konto
   die Anmeldung für alle lahm, oder ein Angriff aus einem Netz
   sperrt reihenweise fremde Konten aus. */
const MAX_PER_EMAIL = 8;
const MAX_PER_IP = 25;
const WINDOW_MINUTES = 15;

export function createAccount(email: string, password: string, role: Account["role"] = "advertiser") {
  const normalized = email.trim().toLowerCase();
  if (one("SELECT id FROM accounts WHERE email = ?", [normalized])) {
    throw conflict("Zu dieser Adresse gibt es bereits ein Konto.");
  }
  const id = newId("acc");
  const at = nowIso();
  run(
    `INSERT INTO accounts (id, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, normalized, hashPassword(password), role, at, at],
  );
  return one<Account>("SELECT * FROM accounts WHERE id = ?", [id])!;
}

export function findByEmail(email: string) {
  return one<Account>("SELECT * FROM accounts WHERE email = ?", [email.trim().toLowerCase()]);
}

export function findById(id: string) {
  return one<Account>("SELECT * FROM accounts WHERE id = ?", [id]);
}

function recentFailures(email: string, ipHash: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const byEmail = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND successful = 0 AND at > ?",
    [email, since],
  )!.n;
  const byIp = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM login_attempts WHERE ip_hash = ? AND successful = 0 AND at > ?",
    [ipHash, since],
  )!.n;
  return { byEmail, byIp };
}

function recordAttempt(email: string, ipHash: string, ok: boolean) {
  run(
    "INSERT INTO login_attempts (id, email, ip_hash, at, successful) VALUES (?, ?, ?, ?, ?)",
    [newId("att"), email, ipHash, nowIso(), ok ? 1 : 0],
  );
}

export function authenticate(email: string, password: string, ipHash: string): Account {
  const normalized = email.trim().toLowerCase();
  const { byEmail, byIp } = recentFailures(normalized, ipHash);
  if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) throw tooMany();

  const account = findByEmail(normalized);

  /* Auch ohne Konto wird geprüft — gegen einen erfundenen Hash. Sonst
     verrät die Antwortzeit, welche Adressen registriert sind. */
  const stored =
    account?.password_hash ??
    "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  const ok = verifyPassword(password, stored) && account !== undefined;

  recordAttempt(normalized, ipHash, ok);
  if (!ok || !account) throw unauthorized("E-Mail-Adresse oder Passwort stimmt nicht.");
  if (account.disabled_at) throw unauthorized("Dieses Konto ist gesperrt.");

  // Parameter erhöht? Dann beim nächsten erfolgreichen Login nachziehen.
  if (needsRehash(account.password_hash)) {
    run("UPDATE accounts SET password_hash = ?, updated_at = ? WHERE id = ?", [
      hashPassword(password),
      nowIso(),
      account.id,
    ]);
  }
  return account;
}

export function startSession(accountId: string, userAgent: string | undefined, ipHash: string) {
  const { raw, hash } = newToken();
  const at = nowIso();
  run(
    `INSERT INTO sessions (token_hash, account_id, created_at, expires_at, last_seen_at, user_agent, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [hash, accountId, at, plusDays(SESSION_DAYS), at, (userAgent ?? "").slice(0, 200), ipHash],
  );
  return { token: raw, expiresAt: plusDays(SESSION_DAYS) };
}

export function resolveSession(token: string): Account | null {
  const hash = hashToken(token);
  const row = one<{ account_id: string; expires_at: string }>(
    "SELECT account_id, expires_at FROM sessions WHERE token_hash = ?",
    [hash],
  );
  if (!row) return null;
  if (row.expires_at <= nowIso()) {
    run("DELETE FROM sessions WHERE token_hash = ?", [hash]);
    return null;
  }
  run("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?", [nowIso(), hash]);
  const account = findById(row.account_id);
  return account && !account.disabled_at ? account : null;
}

export function endSession(token: string) {
  run("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
}

export function endAllSessions(accountId: string) {
  return run("DELETE FROM sessions WHERE account_id = ?", [accountId]);
}

/** Aufräumen: abgelaufene Sitzungen und alte Anmeldeversuche. */
export function pruneAuth() {
  const sessions = run("DELETE FROM sessions WHERE expires_at <= ?", [nowIso()]);
  const attempts = run("DELETE FROM login_attempts WHERE at < ?", [
    new Date(Date.now() - 24 * 3600_000).toISOString(),
  ]);
  return { sessions, attempts };
}

export function listSessions(accountId: string) {
  return all<{ created_at: string; last_seen_at: string; user_agent: string }>(
    "SELECT created_at, last_seen_at, user_agent FROM sessions WHERE account_id = ? ORDER BY last_seen_at DESC",
    [accountId],
  );
}

export const publicAccount = (a: Account) => ({
  id: a.id,
  email: a.email,
  role: a.role,
  locale: a.locale,
  createdAt: a.created_at,
});
