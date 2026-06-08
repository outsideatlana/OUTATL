export type PublicEvent = {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  age_restriction: string | null;
  status: "on_sale" | "sold_out" | "selling_fast" | "free" | string;
  description: string | null;
  poster_url: string | null;
  ticket_url: string | null;
  is_past: boolean;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string | null;
};

type RequestOptions = RequestInit & { admin?: boolean };

async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (options.admin) {
    const token = window.localStorage.getItem("outsideatl_admin_token");
    if (token) headers.set("x-admin-token", token);
  }

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error((errPayload as { error?: string }).error || "Something went wrong.");
  }
  const payload = await response.json();
  return payload as T;
}

export function listPublicEvents() {
  return api<PublicEvent[]>("/api/events");
}

export function submitRsvp(data: Record<string, unknown>) {
  return api<{ ok: true }>("/api/rsvps", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function subscribeNewsletter(data: Record<string, unknown>) {
  return api<{ ok: true }>("/api/newsletter", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitContact(data: Record<string, unknown>) {
  return api<{ ok: true }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitApplication(data: Record<string, unknown>) {
  return api<{ ok: true }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function adminLogin(data: { username: string; password: string }) {
  return api<{ token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function checkAdmin() {
  return api<{ isAdmin: boolean }>("/api/admin/check", { admin: true });
}

export function listAdminEvents() {
  return api<PublicEvent[]>("/api/admin/events", { admin: true });
}

export function saveAdminEvent(data: Partial<PublicEvent>) {
  return api<{ ok: true }>("/api/admin/events", {
    method: "POST",
    admin: true,
    body: JSON.stringify(data),
  });
}

export function deleteAdminEvent(id: string) {
  return api<{ ok: true }>(`/api/admin/events/${id}`, {
    method: "DELETE",
    admin: true,
  });
}

export type AdminSubmissions = {
  rsvps: Array<Record<string, unknown> & { id: string; created_at: string }>;
  newsletter: Array<Record<string, unknown> & { id: string; created_at: string }>;
  applications: Array<Record<string, unknown> & { id: string; created_at: string }>;
  contacts: Array<Record<string, unknown> & { id: string; created_at: string }>;
};

export function listAdminSubmissions() {
  return api<AdminSubmissions>("/api/admin/submissions", { admin: true });
}

export function updateSubmissionStatus(data: {
  table: "applications" | "rsvps";
  id: string;
  review_status: "new" | "reviewed" | "accepted" | "waitlist" | "rejected";
}) {
  return api<{ ok: true }>("/api/admin/submissions/status", {
    method: "PATCH",
    admin: true,
    body: JSON.stringify(data),
  });
}
