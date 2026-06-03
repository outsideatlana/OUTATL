import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  queryOptions,
  useSuspenseQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { listAllEventsAdmin, upsertEvent, deleteEvent } from "@/lib/events.functions";
import {
  listSubmissionsAdmin,
  checkIsAdmin,
  claimFirstAdmin,
  updateSubmissionStatus,
} from "@/lib/submissions.functions";
import { supabase } from "@/integrations/supabase/client";
import { Input, Textarea, Select } from "@/routes/index";
import { toast } from "sonner";

const adminCheckQO = queryOptions({ queryKey: ["admin-check"], queryFn: () => checkIsAdmin() });
const eventsQO = queryOptions({ queryKey: ["admin-events"], queryFn: () => listAllEventsAdmin() });
const submissionsQO = queryOptions({
  queryKey: ["admin-submissions"],
  queryFn: () => listSubmissionsAdmin(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — OutsideAtl" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { data: adminCheck, refetch } = useQuery(adminCheckQO);
  const claimFn = useServerFn(claimFirstAdmin);
  const claim = useMutation({
    mutationFn: () => claimFn(),
    onSuccess: () => {
      toast.success("You are now the admin.");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (!adminCheck) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>
    );
  }

  if (!adminCheck.isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md text-center space-y-6">
          <h1 className="font-display text-4xl uppercase">Not an admin</h1>
          <p className="text-muted-foreground">
            Your account isn't authorized yet. If this is the first admin account for OutsideAtl,
            claim it now.
          </p>
          <button
            onClick={() => claim.mutate()}
            disabled={claim.isPending}
            className="bg-accent text-accent-foreground font-display text-xl uppercase px-8 py-3 disabled:opacity-50"
          >
            {claim.isPending ? "..." : "Claim admin"}
          </button>
          <div>
            <button
              onClick={signOut}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
            >
              [ Sign out ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-2xl uppercase">
            Outside<span className="text-accent">Atl</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-1">
            [ Admin ]
          </span>
        </div>
        <button
          onClick={signOut}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          [ Sign out ]
        </button>
      </header>
      <Tabs />
    </div>
  );
}

function Tabs() {
  const [tab, setTab] = useState<"events" | "rsvps" | "applications" | "newsletter" | "contacts">(
    "events",
  );
  const tabs = [
    { id: "events" as const, label: "Events" },
    { id: "rsvps" as const, label: "RSVPs" },
    { id: "applications" as const, label: "Applications" },
    { id: "newsletter" as const, label: "Newsletter" },
    { id: "contacts" as const, label: "Contact" },
  ];
  return (
    <div>
      <nav className="border-b border-border px-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 font-mono text-xs uppercase tracking-widest border-b-2 ${tab === t.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="p-6">
        {tab === "events" && <EventsManager />}
        {tab !== "events" && <SubmissionsView tab={tab} />}
      </div>
    </div>
  );
}

function EventsManager() {
  const { data: events } = useSuspenseQuery(eventsQO);
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertEvent);
  const delFn = useServerFn(deleteEvent);

  const blank = {
    id: "" as string | "",
    title: "",
    event_date: "",
    venue: "",
    age_restriction: "21+",
    status: "on_sale" as "on_sale" | "sold_out" | "selling_fast" | "free",
    description: "",
    poster_url: "",
    ticket_url: "",
    is_past: false,
    is_published: true,
  };
  const [form, setForm] = useState(blank);
  const set =
    <K extends keyof typeof form>(k: K) =>
    (v: (typeof form)[K] | string) =>
      setForm({ ...form, [k]: v as (typeof form)[K] });

  const save = useMutation({
    mutationFn: () =>
      upsertFn({ data: { ...form, id: form.id || undefined } } as Parameters<typeof upsertFn>[0]),
    onSuccess: () => {
      toast.success(form.id ? "Event updated" : "Event added");
      setForm(blank);
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["public-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["public-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const edit = (e: (typeof events)[number]) =>
    setForm({
      id: e.id,
      title: e.title,
      event_date: new Date(e.event_date).toISOString().slice(0, 16),
      venue: e.venue,
      age_restriction: e.age_restriction ?? "",
      status: (e.status as typeof form.status) ?? "on_sale",
      description: e.description ?? "",
      poster_url: e.poster_url ?? "",
      ticket_url: e.ticket_url ?? "",
      is_past: e.is_past,
      is_published: e.is_published,
    });

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 max-w-6xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-3 border border-border p-6 h-fit sticky top-20"
      >
        <h3 className="font-display text-2xl uppercase mb-4">
          {form.id ? "Edit event" : "New event"}
        </h3>
        <Input placeholder="Title *" required value={form.title} onChange={set("title")} />
        <Input
          type="datetime-local"
          required
          value={form.event_date}
          onChange={set("event_date")}
        />
        <Input placeholder="Venue *" required value={form.venue} onChange={set("venue")} />
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={form.age_restriction}
            onChange={set("age_restriction")}
            options={["18+", "21+", "All ages"]}
          />
          <Select
            value={form.status}
            onChange={set("status") as (v: string) => void}
            options={[
              { value: "on_sale", label: "On sale" },
              { value: "selling_fast", label: "Selling fast" },
              { value: "sold_out", label: "Sold out" },
              { value: "free", label: "Free" },
            ]}
          />
        </div>
        <Input
          placeholder="Poster image URL"
          value={form.poster_url}
          onChange={set("poster_url")}
        />
        <Input
          placeholder="Ticket / RSVP URL"
          value={form.ticket_url}
          onChange={set("ticket_url")}
        />
        <Textarea
          placeholder="Description"
          value={form.description}
          onChange={set("description")}
          rows={4}
        />
        <div className="flex gap-4 text-sm font-mono uppercase tracking-widest">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_past}
              onChange={(e) => setForm({ ...form, is_past: e.target.checked })}
            />
            Past event
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Published
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            disabled={save.isPending}
            className="flex-1 bg-accent text-accent-foreground font-display uppercase py-3 disabled:opacity-50"
          >
            {save.isPending ? "..." : form.id ? "Update" : "Create"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(blank)}
              className="px-4 border border-border font-mono text-xs uppercase"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-display text-2xl uppercase mb-4">All events ({events.length})</h3>
        {events.length === 0 && (
          <p className="text-muted-foreground text-sm">No events yet. Add one →</p>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="border border-border p-4 flex flex-wrap gap-4 justify-between items-start"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {new Date(e.event_date).toLocaleString()}
              </p>
              <p className="font-display text-xl uppercase">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {e.venue} · {e.status} {e.is_past && "· past"} {!e.is_published && "· unpublished"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => edit(e)}
                className="border border-border px-3 py-1 font-mono text-xs uppercase"
              >
                Edit
              </button>
              <button
                onClick={() => confirm(`Delete "${e.title}"?`) && del.mutate(e.id)}
                className="border border-destructive text-destructive px-3 py-1 font-mono text-xs uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUSES = ["new", "reviewed", "accepted", "waitlist", "rejected"] as const;
type Status = (typeof STATUSES)[number];

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SubmissionsView({ tab }: { tab: "rsvps" | "applications" | "newsletter" | "contacts" }) {
  const { data } = useSuspenseQuery(submissionsQO);
  const qc = useQueryClient();
  const updateFn = useServerFn(updateSubmissionStatus);
  const items = data[tab];
  const supportsStatus = tab === "rsvps" || tab === "applications";

  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "intern" | "freelancer" | "vendor" | "artist"
  >("all");
  const [search, setSearch] = useState("");

  const update = useMutation({
    mutationFn: (vars: { id: string; review_status: Status }) =>
      updateFn({
        data: {
          table: tab as "applications" | "rsvps",
          id: vars.id,
          review_status: vars.review_status,
        },
      }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = items.filter((row) => {
    if (supportsStatus && statusFilter !== "all") {
      const s = (row as { review_status?: string }).review_status ?? "new";
      if (s !== statusFilter) return false;
    }
    if (tab === "applications" && typeFilter !== "all") {
      if ((row as { application_type?: string }).application_type !== typeFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!JSON.stringify(row).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts: Record<string, number> = supportsStatus
    ? STATUSES.reduce(
        (acc, s) => {
          acc[s] = items.filter(
            (r) => ((r as { review_status?: string }).review_status ?? "new") === s,
          ).length;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          [ {filtered.length} / {items.length} ]
        </p>
        <div className="flex-1 min-w-[180px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full bg-secondary border border-border px-3 py-2 text-sm font-mono"
          />
        </div>
        {tab === "applications" && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="bg-secondary border border-border px-3 py-2 text-xs font-mono uppercase"
          >
            <option value="all">All types</option>
            <option value="intern">Intern</option>
            <option value="freelancer">Freelancer</option>
            <option value="vendor">Vendor</option>
            <option value="artist">Artist</option>
          </select>
        )}
        <button
          onClick={() =>
            downloadCsv(
              `${tab}-${new Date().toISOString().slice(0, 10)}.csv`,
              toCsv(filtered as Record<string, unknown>[]),
            )
          }
          className="bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest px-4 py-2"
        >
          Export CSV
        </button>
      </div>

      {supportsStatus && (
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${statusFilter === "all" ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
          >
            All ({items.length})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${statusFilter === s ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No entries.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const status = (row as { review_status?: Status }).review_status ?? "new";
            return (
              <details key={row.id} className="border border-border">
                <summary className="px-4 py-3 cursor-pointer flex flex-wrap justify-between gap-4 items-center">
                  <span className="font-mono text-sm">
                    {String(
                      ("full_name" in row && row.full_name) ||
                        ("name" in row && row.name) ||
                        row.email,
                    )}
                    {"application_type" in row && (
                      <span className="ml-3 text-accent">[{String(row.application_type)}]</span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    {supportsStatus && (
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border ${
                          status === "accepted"
                            ? "border-accent text-accent"
                            : status === "rejected"
                              ? "border-destructive text-destructive"
                              : status === "waitlist"
                                ? "border-yellow-500 text-yellow-500"
                                : status === "reviewed"
                                  ? "border-muted-foreground text-muted-foreground"
                                  : "border-border text-foreground"
                        }`}
                      >
                        {status}
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-border bg-secondary">
                  {supportsStatus && (
                    <div className="px-4 py-3 flex flex-wrap gap-2 items-center border-b border-border">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Status:
                      </span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => update.mutate({ id: row.id, review_status: s })}
                          disabled={update.isPending || status === s}
                          className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${status === s ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-accent"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <pre className="px-4 py-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(row, null, 2)}
                  </pre>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
