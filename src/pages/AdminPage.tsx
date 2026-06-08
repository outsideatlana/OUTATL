import { AppLink as Link } from "@/components/app-link";
import {
  checkAdmin,
  deleteAdminEvent,
  listAdminEvents,
  listAdminSubmissions,
  saveAdminEvent,
  updateSubmissionStatus,
  type AdminSubmissions,
  type PublicEvent,
} from "@/lib/api";
import { Input, Select, Textarea } from "@/routes/index";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

type AdminTab = "events" | "rsvps" | "applications" | "newsletter" | "contacts";
type Status = "new" | "reviewed" | "accepted" | "waitlist" | "rejected";

const statuses: Status[] = ["new", "reviewed", "accepted", "waitlist", "rejected"];

const blankEvent = {
  id: "",
  title: "",
  event_date: "",
  venue: "",
  age_restriction: "21+",
  status: "on_sale",
  description: "",
  poster_url: "",
  ticket_url: "",
  is_past: false,
  is_published: true,
};

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAdmin()
      .then(() => setAllowed(true))
      .catch(() => setAllowed(false))
      .finally(() => setReady(true));
  }, []);

  const signOut = () => {
    window.localStorage.removeItem("outsideatl_admin_token");
    window.location.href = "/auth";
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md text-center space-y-6">
          <h1 className="font-display text-4xl uppercase">Admin session expired</h1>
          <p className="text-muted-foreground">
            Sign in again with the private admin username and password.
          </p>
          <button
            onClick={signOut}
            className="bg-accent text-accent-foreground font-display text-xl uppercase px-8 py-3"
          >
            Back to login
          </button>
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
      <AdminTabs />
    </div>
  );
}

function AdminTabs() {
  const [tab, setTab] = useState<AdminTab>("events");
  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: "events", label: "Events" },
    { id: "rsvps", label: "RSVPs" },
    { id: "applications", label: "Applications" },
    { id: "newsletter", label: "Newsletter" },
    { id: "contacts", label: "Contact" },
  ];

  return (
    <div>
      <nav className="border-b border-border px-6 flex gap-1 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-4 py-3 font-mono text-xs uppercase tracking-widest border-b-2 ${
              tab === item.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6">
        {tab === "events" ? <EventsManager /> : <SubmissionsView tab={tab} />}
      </div>
    </div>
  );
}

function EventsManager() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [form, setForm] = useState(blankEvent);
  const [eventsStatus, setEventsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setEventsStatus("loading");
    return listAdminEvents()
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setEventsStatus("ready");
      })
      .catch((error) => {
        setEvents([]);
        setEventsStatus("error");
        toast.error(error.message);
      });
  };

  useEffect(() => {
    refresh();
  }, []);

  const set =
    <K extends keyof typeof form>(key: K) =>
    (value: (typeof form)[K] | string) =>
      setForm({ ...form, [key]: value as (typeof form)[K] });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveAdminEvent({ ...form, id: form.id || undefined });
      toast.success(form.id ? "Event updated" : "Event added");
      setForm(blankEvent);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save event.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (event: PublicEvent) =>
    setForm({
      id: event.id,
      title: event.title,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      venue: event.venue,
      age_restriction: event.age_restriction ?? "",
      status: event.status,
      description: event.description ?? "",
      poster_url: event.poster_url ?? "",
      ticket_url: event.ticket_url ?? "",
      is_past: event.is_past,
      is_published: event.is_published ?? true,
    });

  const remove = async (event: PublicEvent) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    try {
      await deleteAdminEvent(event.id);
      toast.success("Deleted");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete event.");
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 max-w-6xl">
      <form onSubmit={onSubmit} className="space-y-3 border border-border p-6 h-fit sticky top-20">
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
        <Input
          placeholder="Age restriction"
          value={form.age_restriction}
          onChange={set("age_restriction")}
        />
        <Select
          value={form.status}
          onChange={set("status")}
          options={["on_sale", "selling_fast", "sold_out", "free"]}
        />
        <Input placeholder="Poster URL" value={form.poster_url} onChange={set("poster_url")} />
        <Input placeholder="Ticket URL" value={form.ticket_url} onChange={set("ticket_url")} />
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
        <button
          disabled={saving}
          className="w-full bg-accent text-accent-foreground font-display uppercase py-3 disabled:opacity-50"
        >
          {saving ? "..." : form.id ? "Update" : "Create"}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-display text-2xl uppercase mb-4">All events ({events.length})</h3>
        {eventsStatus === "loading" ? (
          <AdminStateBlock title="Loading events" body="Pulling the event list." />
        ) : eventsStatus === "error" ? (
          <AdminStateBlock
            title="Events unavailable"
            body="The event list did not load. Check your admin session and Supabase connection."
          />
        ) : events.length === 0 ? (
          <AdminStateBlock title="No events yet" body="Create the first event with the form." />
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="border border-border p-4 flex flex-wrap gap-4 justify-between items-start"
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {new Date(event.event_date).toLocaleString()}
                </p>
                <p className="font-display text-xl uppercase">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {event.venue} / {event.status} {event.is_past && "/ past"}{" "}
                  {!event.is_published && "/ unpublished"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => edit(event)}
                  className="border border-border px-3 py-1 font-mono text-xs uppercase"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(event)}
                  className="border border-destructive text-destructive px-3 py-1 font-mono text-xs uppercase"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SubmissionsView({ tab }: { tab: Exclude<AdminTab, "events"> }) {
  const [data, setData] = useState<AdminSubmissions | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");

  const refresh = () => {
    setStatus("loading");
    return listAdminSubmissions()
      .then((payload) => {
        setData(payload);
        setStatus("ready");
      })
      .catch((error) => {
        setData(null);
        setStatus("error");
        toast.error(error.message);
      });
  };

  useEffect(() => {
    refresh();
  }, []);

  if (status === "loading")
    return <AdminStateBlock title="Loading submissions" body="Pulling inbox data." />;
  if (status === "error") {
    return (
      <AdminStateBlock
        title="Submissions unavailable"
        body="The submission inbox did not load. Check your admin session and Supabase connection."
      />
    );
  }
  if (!data)
    return <AdminStateBlock title="No submissions loaded" body="Refresh the page to try again." />;

  const tabData = Array.isArray(data[tab]) ? data[tab] : [];
  const rows = tabData.filter((row) =>
    search.trim() ? JSON.stringify(row).toLowerCase().includes(search.toLowerCase()) : true,
  );
  const supportsStatus = tab === "rsvps" || tab === "applications";

  const setSubmissionStatus = async (row: { id: string }, status: Status) => {
    try {
      await updateSubmissionStatus({
        table: tab as "applications" | "rsvps",
        id: row.id,
        review_status: status,
      });
      toast.success("Status updated");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status.");
    }
  };

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          [ {rows.length} / {tabData.length} ]
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-[180px] bg-secondary border border-border px-3 py-2 text-sm font-mono"
        />
      </div>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <AdminStateBlock
            title={search.trim() ? "No matches" : "No submissions yet"}
            body={search.trim() ? "Try a different search." : "New submissions will appear here."}
          />
        ) : (
          rows.map((row) => {
            const status = (row.review_status as Status | undefined) ?? "new";
            return (
              <details key={row.id} className="border border-border">
                <summary className="px-4 py-3 cursor-pointer flex flex-wrap justify-between gap-4 items-center">
                  <span className="font-mono text-sm">
                    {String(row.full_name || row.name || row.email || row.id)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                  </span>
                </summary>
                {supportsStatus && (
                  <div className="px-4 py-3 flex flex-wrap gap-2 items-center border-t border-border">
                    {statuses.map((item) => (
                      <button
                        key={item}
                        onClick={() => setSubmissionStatus(row, item)}
                        className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${
                          status === item
                            ? "bg-accent text-accent-foreground border-accent"
                            : "border-border hover:border-accent"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
                <pre className="border-t border-border bg-secondary px-4 py-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(row, null, 2)}
                </pre>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}

function AdminStateBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border p-8 text-center">
      <p className="font-display text-2xl uppercase mb-3">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
