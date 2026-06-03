import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(
      "id, title, event_date, venue, age_restriction, status, description, poster_url, ticket_url, is_past",
    )
    .eq("is_published", true)
    .order("event_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const eventInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  event_date: z.string().min(1),
  venue: z.string().min(1).max(200),
  age_restriction: z.string().max(20).optional().nullable(),
  status: z.enum(["on_sale", "sold_out", "selling_fast", "free"]).default("on_sale"),
  description: z.string().max(2000).optional().nullable(),
  poster_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  ticket_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  is_past: z.boolean().default(false),
  is_published: z.boolean().default(true),
});

export const upsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => eventInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      ...data,
      poster_url: data.poster_url || null,
      ticket_url: data.ticket_url || null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("events").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { id: _omit, ...insertData } = payload;
      const { error } = await supabaseAdmin.from("events").insert(insertData);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllEventsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
