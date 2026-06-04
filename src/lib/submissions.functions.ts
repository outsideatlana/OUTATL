import { createServerFn } from "@tanstack/react-start";
import { loginAdmin, requireAdminToken } from "@/lib/admin-auth.server";
import { z } from "zod";

const email = z.string().email().max(255);
const optStr = (max = 500) => z.string().max(max).optional().nullable().or(z.literal(""));

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        username: z.string().min(1).max(120),
        password: z.string().min(1).max(300),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    return { ok: true, token: loginAdmin(data.username, data.password) };
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        event_id: z.string().uuid().optional().nullable(),
        full_name: z.string().min(1).max(120),
        email,
        phone: optStr(40),
        age_range: optStr(20),
        social_handle: optStr(80),
        college_affiliation: optStr(120),
        preferred_event_types: optStr(200),
        notes: optStr(1000),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, event_id: data.event_id || null };
    const { error } = await supabaseAdmin.from("rsvps").insert(payload);
    if (error) throw new Error(error.message);
    try {
      const { syncRsvpToAirtable } = await import("./airtable.server");
      await syncRsvpToAirtable(payload);
    } catch (e) {
      console.error("[Airtable RSVP sync] failed:", e instanceof Error ? e.message : e);
    }
    return { ok: true };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ email }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ email: data.email.toLowerCase() });
    if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        email,
        subject: optStr(160),
        message: z.string().min(1).max(2000),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
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

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => applicationSchema.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").insert(data);
    if (error) throw new Error(error.message);
    try {
      const { syncApplicationToAirtable } = await import("./airtable.server");
      await syncApplicationToAirtable(data);
    } catch (e) {
      console.error("[Airtable sync] failed:", e instanceof Error ? e.message : e);
    }
    return { ok: true };
  });

const REVIEW_STATUSES = ["new", "reviewed", "accepted", "waitlist", "rejected"] as const;

export const updateSubmissionStatus = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: z.string().min(1),
        table: z.enum(["applications", "rsvps"]),
        id: z.string().uuid(),
        review_status: z.enum(REVIEW_STATUSES),
        admin_notes: z.string().max(2000).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      review_status: data.review_status,
      ...(data.admin_notes !== undefined ? { admin_notes: data.admin_notes } : {}),
    };
    const q =
      data.table === "applications"
        ? supabaseAdmin.from("applications").update(patch).eq("id", data.id)
        : supabaseAdmin.from("rsvps").update(patch).eq("id", data.id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSubmissionsAdmin = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [rsvps, newsletter, applications, contacts] = await Promise.all([
      supabaseAdmin.from("rsvps").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    return {
      rsvps: rsvps.data ?? [],
      newsletter: newsletter.data ?? [],
      applications: applications.data ?? [],
      contacts: contacts.data ?? [],
    };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ token: z.string().optional().nullable() }).parse(i))
  .handler(async ({ data }) => {
    try {
      requireAdminToken(data.token);
      return { isAdmin: true, userId: "admin" };
    } catch {
      return { isAdmin: false, userId: null };
    }
  });
