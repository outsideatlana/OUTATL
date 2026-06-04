// Server-only helper to mirror submissions into Airtable via the connector gateway.
// No-ops gracefully when secrets are missing so primary Supabase inserts always succeed.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/airtable";

type ApplicationRecord = {
  application_type: string;
  full_name: string;
  stage_name?: string | null;
  email: string;
  phone?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  portfolio_url?: string | null;
  music_url?: string | null;
  preferred_role?: string | null;
  experience_level?: string | null;
  genre?: string | null;
  past_experience?: string | null;
  expected_rate?: string | null;
  preferred_event_type?: string | null;
  availability?: string | null;
  message?: string | null;
  extra?: Record<string, string | number | boolean | null> | undefined;
};

type RsvpRecord = {
  event_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  age_range?: string | null;
  social_handle?: string | null;
  college_affiliation?: string | null;
  preferred_event_types?: string | null;
  notes?: string | null;
};

function tableUrl(baseId: string, tableNameOrId: string) {
  return `${GATEWAY_URL}/v0/${baseId}/${encodeURIComponent(tableNameOrId)}`;
}

async function postToAirtable(url: string, fields: Record<string, unknown>): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const airtableKey = process.env.AIRTABLE_API_KEY;
  if (!lovableKey || !airtableKey) return;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": airtableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
}

function buildApplicationFields(app: ApplicationRecord): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Type: app.application_type,
    Name: app.full_name,
    Email: app.email,
    Submitted: new Date().toISOString(),
  };
  if (app.stage_name) fields["Stage Name"] = app.stage_name;
  if (app.phone) fields.Phone = app.phone;
  if (app.instagram) fields.Instagram = app.instagram;
  if (app.tiktok) fields.TikTok = app.tiktok;
  if (app.portfolio_url) fields.Portfolio = app.portfolio_url;
  if (app.music_url) fields["Music URL"] = app.music_url;
  if (app.preferred_role) fields.Role = app.preferred_role;
  if (app.experience_level) fields.Experience = app.experience_level;
  if (app.genre) fields.Genre = app.genre;
  if (app.past_experience) fields["Past Experience"] = app.past_experience;
  if (app.expected_rate) fields.Rate = app.expected_rate;
  if (app.preferred_event_type) fields["Event Type"] = app.preferred_event_type;
  if (app.availability) fields.Availability = app.availability;
  if (app.message) fields.Message = app.message;
  if (app.extra && Object.keys(app.extra).length) {
    fields.Details = JSON.stringify(app.extra, null, 2);
    for (const key of [
      "company_name",
      "website",
      "package",
      "custom_ask",
      "budget",
      "goals",
      "outreach_preference",
      "contact_role",
    ]) {
      const v = app.extra[key];
      if (v != null && v !== "") {
        const label = key.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
        fields[label] = v;
      }
    }
  }
  return fields;
}

function buildRsvpFields(r: RsvpRecord): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Name: r.full_name,
    Email: r.email,
    Submitted: new Date().toISOString(),
  };
  if (r.phone) fields.Phone = r.phone;
  if (r.age_range) fields["Age Range"] = r.age_range;
  if (r.social_handle) fields.Social = r.social_handle;
  if (r.college_affiliation) fields.College = r.college_affiliation;
  if (r.preferred_event_types) fields["Event Interests"] = r.preferred_event_types;
  if (r.notes) fields.Notes = r.notes;
  if (r.event_id) fields["Event ID"] = r.event_id;
  return fields;
}

export async function syncApplicationToAirtable(app: ApplicationRecord): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) return;
  // Route vendor apps to the dedicated vendors table when configured.
  const vendorsTable = process.env.AIRTABLE_VENDORS_TABLE;
  const defaultTable = process.env.AIRTABLE_APPLICATIONS_TABLE || "Applications";
  const table = app.application_type === "vendor" && vendorsTable ? vendorsTable : defaultTable;
  await postToAirtable(tableUrl(baseId, table), buildApplicationFields(app));
}

export async function syncRsvpToAirtable(rsvp: RsvpRecord): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_RSVPS_TABLE;
  if (!baseId || !table) return;
  await postToAirtable(tableUrl(baseId, table), buildRsvpFields(rsvp));
}
