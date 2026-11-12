import crypto from "crypto";

function sameText(left: string, right: string): boolean {
  const a = crypto.createHash("sha256").update(left).digest();
  const b = crypto.createHash("sha256").update(right).digest();
  return crypto.timingSafeEqual(a, b);
}

export function adminPasswordMatches(password: string, stored: string): boolean {
  const [salt, encoded] = stored.split(".");
  if (!salt || !encoded) return false;
  const actual = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(encoded, "base64url");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function adminCredentialsMatch(email: string, password: string): boolean {
  const expectedEmail = (process.env.ADMIN_EMAIL ?? process.env.AVA_BOOTSTRAP_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const plain = process.env.ADMIN_PASSWORD ?? process.env.AVA_BOOTSTRAP_ADMIN_PASSWORD ?? "";
  if (!expectedEmail || (!hash && !plain)) return false;
  const emailOk = sameText(email.trim().toLowerCase(), expectedEmail);
  const passwordOk = hash ? adminPasswordMatches(password, hash) : sameText(password, plain);
  return emailOk && passwordOk;
}

export function adminLoginConfigured(): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL ?? process.env.AVA_BOOTSTRAP_ADMIN_EMAIL ?? "";
  const secret = process.env.ADMIN_PASSWORD_HASH ?? process.env.ADMIN_PASSWORD ?? process.env.AVA_BOOTSTRAP_ADMIN_PASSWORD ?? "";
  return expectedEmail.trim().length > 0 && secret.length > 0;
}
