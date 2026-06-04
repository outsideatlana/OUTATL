import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

type AdminTokenPayload = {
  sub: "admin";
  exp: number;
};

export function loginAdmin(username: string, password: string) {
  const expectedUsername = getAdminEnv("ADMIN_USERNAME");
  const expectedPassword = getAdminEnv("ADMIN_PASSWORD");

  if (!expectedUsername || !expectedPassword) {
    throw new Error("Admin login is not configured.");
  }

  if (
    !safeEqual(username.trim(), expectedUsername.trim()) ||
    !safeEqual(password, expectedPassword)
  ) {
    throw new Error("Invalid username or password.");
  }

  return signToken({
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
}

export function requireAdminToken(token?: string | null) {
  if (!token) throw new Error("Admin login required.");
  return verifyToken(token);
}

function signToken(payload: AdminTokenPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("Admin session is invalid.");

  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  if (!safeEqual(signature, expected)) throw new Error("Admin session is invalid.");

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminTokenPayload;
  if (payload.sub !== "admin" || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Admin session has expired.");
  }
  return payload;
}

function getSecret() {
  const secret = getAdminEnv("ADMIN_AUTH_SECRET");
  if (!secret || secret.length < 32) throw new Error("ADMIN_AUTH_SECRET must be configured.");
  return secret;
}

function getAdminEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD" | "ADMIN_AUTH_SECRET") {
  return readLocalAdminEnv()[name] ?? process.env[name];
}

function readLocalAdminEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const entries = fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([^#][^=]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1].trim(), match[2]] as const);
    return Object.fromEntries(entries) as Partial<
      Record<"ADMIN_USERNAME" | "ADMIN_PASSWORD" | "ADMIN_AUTH_SECRET", string>
    >;
  } catch {
    return {};
  }
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
