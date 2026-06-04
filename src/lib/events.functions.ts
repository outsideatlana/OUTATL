import { createServerFn } from "@tanstack/react-start";
import { requireAdminToken } from "@/lib/admin-auth.server";
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
  token: z.string().min(1),
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
  .inputValidator((input: unknown) => eventInput.parse(input))
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { token: _token, ...eventData } = data;
    const payload = {
      ...eventData,
      poster_url: eventData.poster_url || null,
      ticket_url: eventData.ticket_url || null,
      updated_at: new Date().toISOString(),
    };
    if (eventData.id) {
      const { error } = await supabaseAdmin.from("events").update(payload).eq("id", eventData.id);
      if (error) throw new Error(error.message);
    } else {
      const { id: _omit, ...insertData } = payload;
      const { error } = await supabaseAdmin.from("events").insert(insertData);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().min(1), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllEventsAdmin = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    requireAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
