import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const optStr = (max = 160) => z.string().max(max).optional().nullable().or(z.literal(""));

const memberProfileInput = z.object({
  full_name: optStr(120),
  phone: optStr(40),
  wants_discounts: z.boolean().default(true),
  wants_private_events: z.boolean().default(true),
  wants_first_notices: z.boolean().default(true),
  joined_mail_list: z.boolean().default(true),
});

type AuthContext = {
  supabase: Awaited<typeof import("@/integrations/supabase/client")>["supabase"];
  userId: string;
  claims: {
    email?: string;
  };
};

export const getMemberProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context as AuthContext;
    const { data, error } = await supabase
      .from("member_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;

    const profile = {
      user_id: userId,
      email: claims.email ?? "",
      wants_discounts: true,
      wants_private_events: true,
      wants_first_notices: true,
      joined_mail_list: true,
      updated_at: new Date().toISOString(),
    };
    const { data: created, error: createError } = await supabase
      .from("member_profiles")
      .insert(profile)
      .select("*")
      .single();
    if (createError) throw new Error(createError.message);
    if (created.joined_mail_list) await syncMemberEmail(created.email);
    return created;
  });

export const updateMemberProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => memberProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as AuthContext;
    const normalized = {
      full_name: clean(data.full_name),
      phone: clean(data.phone),
      wants_discounts: data.wants_discounts,
      wants_private_events: data.wants_private_events,
      wants_first_notices: data.wants_first_notices,
      joined_mail_list: data.joined_mail_list,
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error } = await supabase
      .from("member_profiles")
      .upsert(
        {
          user_id: userId,
          email: claims.email ?? "",
          ...normalized,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    if (profile.joined_mail_list) await syncMemberEmail(profile.email);
    return profile;
  });

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function syncMemberEmail(email: string) {
  if (!email) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await Promise.all([
    supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email" }),
    supabaseAdmin.from("deal_private_event_signups").upsert(
      {
        email,
        signup_source: "member_account",
        consent_marketing: true,
      },
      { onConflict: "email" },
    ),
  ]);
}
