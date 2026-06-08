import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 5173);
const app = express();

app.use(express.json({ limit: "1mb" }));

const email = z.string().email().max(255);
const optStr = (max = 500) => z.string().max(max).optional().nullable().or(z.literal(""));

function env(name) {
  return process.env[name] || readEnvFile(".env.local")[name] || readEnvFile(".env")[name];
}

const envCache = new Map();
function readEnvFile(file) {
  if (envCache.has(file)) return envCache.get(file);
  const fullPath = path.join(process.cwd(), file);
  try {
    const values = Object.fromEntries(
      fs
        .readFileSync(fullPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([^#][^=]+)=(.*)$/))
        .filter(Boolean)
        .map((match) => [match[1].trim(), match[2].trim()]),
    );
    envCache.set(file, values);
    return values;
  } catch {
    envCache.set(file, {});
    return {};
  }
}

function supabaseUrl() {
  return env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
}

function supabasePublicKey() {
  return env("SUPABASE_PUBLISHABLE_KEY") || env("VITE_SUPABASE_PUBLISHABLE_KEY");
}

function publicClient() {
  const url = supabaseUrl();
  const key = supabasePublicKey();
  if (!url || !key) throw new Error("Supabase URL and publishable key are required.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function adminClient() {
  const url = supabaseUrl();
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase URL and service role key are required.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function jsonError(res, error, status = 400) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  console.error("[API]", message, error);
  res.status(status).json({ error: message });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/events", async (_req, res) => {
  try {
    const { data, error } = await publicClient()
      .from("events")
      .select(
        "id, title, event_date, venue, age_restriction, status, description, poster_url, ticket_url, is_past",
      )
      .eq("is_published", true)
      .order("event_date", { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("[Events] public event listing failed:", error);
    res.json([]);
  }
});

const rsvpSchema = z.object({
  event_id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(1).max(120),
  email,
  phone: optStr(40),
  age_range: optStr(20),
  social_handle: optStr(80),
  college_affiliation: optStr(120),
  preferred_event_types: optStr(200),
  notes: optStr(1000),
});

app.post("/api/rsvps", async (req, res) => {
  try {
    const payload = rsvpSchema.parse(req.body);
    const { error } = await adminClient()
      .from("rsvps")
      .insert({
        ...payload,
        event_id: payload.event_id || null,
      });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

const newsletterSchema = z.object({
  email,
  signup_source: z.string().max(120).optional(),
  consent_marketing: z.boolean().optional(),
});

app.post("/api/newsletter", async (req, res) => {
  try {
    const payload = newsletterSchema.parse(req.body);
    const client = adminClient();
    const normalized = payload.email.toLowerCase();
    const { error } = await client
      .from("newsletter_subscribers")
      .upsert(
        {
          email: normalized,
          signup_source: payload.signup_source || null,
          consent_marketing: payload.consent_marketing ?? true,
        },
        { onConflict: "email" },
      );
    if (error) throw error;

    if (payload.signup_source?.includes("deals") || payload.signup_source?.includes("private")) {
      const { error: dealError } = await client
        .from("deal_private_event_signups")
        .upsert(
          { email: normalized, signup_source: payload.signup_source },
          { onConflict: "email" },
        );
      if (dealError) throw dealError;
    }

    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email,
  subject: optStr(160),
  message: z.string().min(1).max(2000),
});

app.post("/api/contact", async (req, res) => {
  try {
    const payload = contactSchema.parse(req.body);
    const { error } = await adminClient().from("contact_messages").insert(payload);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

const applicationSchema = z.object({
  application_type: z.enum(["intern", "freelancer", "vendor", "artist", "sponsor"]),
  full_name: z.string().min(1).max(120),
  stage_name: optStr(120),
  email,
  phone: optStr(40),
  instagram: optStr(120),
  tiktok: optStr(120),
  portfolio_url: optStr(500),
  music_url: optStr(500),
  preferred_role: optStr(200),
  experience_level: optStr(80),
  genre: optStr(120),
  past_experience: optStr(2000),
  expected_rate: optStr(120),
  preferred_event_type: optStr(160),
  availability: optStr(200),
  message: optStr(2000),
  extra: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

app.post("/api/applications", async (req, res) => {
  try {
    const payload = applicationSchema.parse(req.body);
    const { error } = await adminClient().from("applications").insert(payload);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function adminSecret() {
  const secret = env("ADMIN_AUTH_SECRET");
  if (!secret || secret.length < 32) throw new Error("ADMIN_AUTH_SECRET must be configured.");
  return secret;
}

function signAdminToken() {
  const body = Buffer.from(
    JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", adminSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

async function requireAdmin(req, res, next) {
  try {
    const token = req.get("x-admin-token");
    if (!token) throw new Error("Admin login required.");

    // Supabase JWT — 3-part base64url, starts with eyJ
    if (token.startsWith("eyJ")) {
      const { data: { user }, error } = await adminClient().auth.getUser(token);
      if (error || !user) throw new Error("Admin session is invalid.");
      const { data: roleRow } = await adminClient()
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!roleRow || roleRow.role !== "admin") throw new Error("Not an admin.");
      return next();
    }

    // Legacy HMAC token (backward compat)
    const [body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", adminSecret()).update(body).digest("base64url");
    if (!body || !sig || !safeEqual(sig, expected)) throw new Error("Admin session is invalid.");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.sub !== "admin" || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Admin session has expired.");
    }
    next();
  } catch (error) {
    jsonError(res, error, 401);
  }
}

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = z
      .object({ username: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);

    const expectedUsername = env("ADMIN_USERNAME");
    const expectedPassword = env("ADMIN_PASSWORD");
    if (!expectedUsername || !expectedPassword) throw new Error("Admin login is not configured.");
    if (
      !safeEqual(username.trim(), expectedUsername.trim()) ||
      !safeEqual(password, expectedPassword)
    ) {
      throw new Error("Invalid username or password.");
    }

    // Build a Supabase-compatible email for the admin account.
    // If ADMIN_USERNAME already looks like an email, use it as-is.
    const adminEmail = expectedUsername.includes("@")
      ? expectedUsername
      : `${expectedUsername}@admin.outsideatl.app`;

    const supa = adminClient();

    // Try Supabase sign-in first; on failure, bootstrap the admin account.
    const signIn = await publicClient().auth.signInWithPassword({ email: adminEmail, password });
    let session;

    if (signIn.error) {
      // First-time setup: create Supabase auth user + grant admin role.
      const { data: created, error: createErr } = await supa.auth.admin.createUser({
        email: adminEmail,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;

      await supa
        .from("user_roles")
        .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });

      const retry = await publicClient().auth.signInWithPassword({ email: adminEmail, password });
      if (retry.error) throw retry.error;
      session = retry.data.session;
    } else {
      session = signIn.data.session;
      // Keep admin role in sync (idempotent).
      await supa
        .from("user_roles")
        .upsert({ user_id: signIn.data.user.id, role: "admin" }, { onConflict: "user_id,role" });
    }

    res.json({ token: session.access_token });
  } catch (error) {
    jsonError(res, error, 401);
  }
});

app.get("/api/admin/check", requireAdmin, (_req, res) => {
  res.json({ isAdmin: true });
});

app.get("/api/admin/events", requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await adminClient()
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    jsonError(res, error);
  }
});

app.post("/api/admin/events", requireAdmin, async (req, res) => {
  try {
    const payload = z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(200),
        event_date: z.string().min(1),
        venue: z.string().min(1).max(200),
        age_restriction: optStr(20),
        status: z.enum(["on_sale", "sold_out", "selling_fast", "free"]),
        description: optStr(2000),
        poster_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
        ticket_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
        is_past: z.boolean(),
        is_published: z.boolean(),
      })
      .parse(req.body);
    const { id, ...event } = payload;
    const data = {
      ...event,
      poster_url: event.poster_url || null,
      ticket_url: event.ticket_url || null,
      updated_at: new Date().toISOString(),
    };
    const query = id
      ? adminClient().from("events").update(data).eq("id", id)
      : adminClient().from("events").insert(data);
    const { error } = await query;
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

app.delete("/api/admin/events/:id", requireAdmin, async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { error } = await adminClient().from("events").delete().eq("id", id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

app.get("/api/admin/submissions", requireAdmin, async (_req, res) => {
  try {
    const client = adminClient();
    const [rsvps, newsletter, applications, contacts] = await Promise.all([
      client.from("rsvps").select("*").order("created_at", { ascending: false }).limit(500),
      client
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      client.from("applications").select("*").order("created_at", { ascending: false }).limit(500),
      client
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    for (const result of [rsvps, newsletter, applications, contacts]) {
      if (result.error) throw result.error;
    }
    res.json({
      rsvps: rsvps.data ?? [],
      newsletter: newsletter.data ?? [],
      applications: applications.data ?? [],
      contacts: contacts.data ?? [],
    });
  } catch (error) {
    jsonError(res, error);
  }
});

app.patch("/api/admin/submissions/status", requireAdmin, async (req, res) => {
  try {
    const payload = z
      .object({
        table: z.enum(["applications", "rsvps"]),
        id: z.string().uuid(),
        review_status: z.enum(["new", "reviewed", "accepted", "waitlist", "rejected"]),
      })
      .parse(req.body);
    const { error } = await adminClient()
      .from(payload.table)
      .update({ review_status: payload.review_status })
      .eq("id", payload.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
});

if (isProduction) {
  app.use(express.static(path.resolve("dist")));
  app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`OutsideAtl running at http://localhost:${port}`);
});
