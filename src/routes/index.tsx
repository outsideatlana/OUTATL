import { AppLink as Link } from "@/components/app-link";
import {
  listPublicEvents,
  submitRsvp,
  subscribeNewsletter,
  submitContact,
  type PublicEvent,
} from "@/lib/api";
import { useAsyncMutation } from "@/lib/useAsyncMutation";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { MailingListPopup } from "@/components/mailing-list-popup";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

/*
  head: () => ({
    meta: [
      { title: "OutsideAtl — Atlanta Nightlife, Live Music & Events" },
      {
        name: "description",
        content:
          "OutsideAtl curates Atlanta's after-hours: warehouse raves, day parties, DJ nights, and artist showcases. RSVP, apply to work with us, or submit your music.",
      },
      { property: "og:title", content: "OutsideAtl — The Sound of Atlanta's After-Hours" },
      {
        property: "og:description",
        content: "Parties, festivals, concerts, and artist-focused experiences across Atlanta.",
      },
    ],
  }),
  legacy loader removed during Vite migration,
  component: Index,
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <p className="text-muted-foreground">Couldn't load the page: {error.message}</p>
    </div>
  ),
*/

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    short: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    long: d
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      .toUpperCase(),
  };
}

export default function HomePage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsStatus, setEventsStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    document.title = "OutsideAtl - Atlanta Nightlife, Live Music & Events";
    setEventsStatus("loading");
    listPublicEvents()
      .then((data) => {
        setEvents(data);
        setEventsStatus("ready");
      })
      .catch((error) => {
        console.error("[Events] public event listing failed:", error);
        setEvents([]);
        setEventsStatus("error");
      });
  }, []);

  const upcoming = events.filter((e) => !e.is_past);
  const past = events.filter((e) => e.is_past);

  return (
    <div className="min-h-dvh text-foreground font-sans">
      <SiteNav />
      <main id="main">
        <Hero />
        <Ticker events={upcoming} isLoading={eventsStatus === "loading"} />
        <UpcomingEvents events={upcoming} status={eventsStatus} />
        <ApplicationHub />
        <PastRecaps events={past} isLoading={eventsStatus === "loading"} />
        <RsvpSection events={upcoming} />
        <AboutSection />
        <ContactSection />
        <NewsletterSection />
      </main>
      <SiteFooter />
      <MailingListPopup />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-end px-6 pb-20 overflow-hidden gradient-divider">
      <div className="absolute inset-0 z-0 bg-linear-to-b from-background/40 via-background/80 to-background" />
      <div className="hero-glow z-0" />
      <div className="hero-radial z-0" />
      <div className="relative z-10 max-w-6xl animate-[slide-up_0.8s_var(--ease-out-expo)_both]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
          [ Atlanta / Live Music / Nightlife ]
        </p>
        <h1
          className="font-display text-[clamp(3.5rem,13vw,11rem)] leading-[0.85] uppercase tracking-tighter text-balance"
          style={{ textShadow: "0 0 80px hsl(220 90% 40% / 0.4)" }}
        >
          The Sound of <span className="text-red-600">Atlanta</span>'s
          <br />
          After-Hours
        </h1>
        <p className="mt-8 max-w-xl text-lg text-pretty leading-relaxed text-muted-foreground">
          We curate high-energy social experiences — from hidden warehouse raves to sun-drenched day
          parties. Building the next era of Atlanta's nightlife culture.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#events"
            className="bg-accent text-accent-foreground px-8 py-4 font-display text-xl uppercase tracking-tight hover:scale-105 transition-transform shadow-[0_0_40px_hsl(220_90%_40%/0.5)]"
          >
            Upcoming Shows
          </a>
          <Link
            to="/apply/$type"
            params={{ type: "artist" }}
            className="border border-foreground/30 px-8 py-4 font-display text-xl uppercase tracking-tight backdrop-blur-md hover:bg-foreground hover:text-background transition-all"
          >
            Artist Submission
          </Link>
        </div>
      </div>
    </section>
  );
}

function Ticker({
  events,
  isLoading,
}: {
  events: Array<{ id: string; title: string; event_date: string }>;
  isLoading: boolean;
}) {
  const items = (() => {
    if (isLoading) return ["LOADING EVENT DROPS", "SYNCING ATLANTA CALENDAR", "ONE SEC"];
    if (events.length > 0) {
      return events
        .slice(0, 6)
        .map((e) => `${formatDate(e.event_date).short} — ${e.title.toUpperCase()}`);
    }
    return [
      "NEW EVENTS DROPPING SOON",
      "FOLLOW @OUTSID3.ATL FOR UPDATES",
      "BOOKINGS OPEN",
      "VENDOR APPS OPEN",
    ];
  })();
  const loop = [...items, ...items, ...items];
  return (
    <div className="bg-accent text-accent-foreground py-3 overflow-hidden border-y border-accent">
      <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] font-mono text-sm font-bold uppercase">
        {loop.map((t, i) => (
          <span key={i} className="px-6 flex items-center gap-6">
            {t}
            <span className="opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function UpcomingEvents({
  events,
  status,
}: {
  events: Awaited<ReturnType<typeof listPublicEvents>>;
  status: "loading" | "ready" | "error";
}) {
  return (
    <section id="events" className="relative px-6 py-24 gradient-divider">
      <div className="flex flex-wrap justify-between items-end mb-12 gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
            [ 01 / Calendar ]
          </p>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter">
            Upcoming
            <br />
            Drops
          </h2>
        </div>
        <a
          href="#rsvp"
          className="font-mono text-xs text-muted-foreground uppercase tracking-widest hover:text-accent"
        >
          [ Pre-RSVP → ]
        </a>
      </div>

      {status === "loading" ? (
        <EventStatusCard label="[ Loading shows ]" title="Pulling the next drop." />
      ) : status === "error" ? (
        <EventStatusCard
          label="[ Calendar unavailable ]"
          title="The drop list did not load."
          body="The site is still live. Check back in a minute or join the list below for event updates."
        />
      ) : events.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            [ No shows announced yet ]
          </p>
          <p className="font-display text-3xl uppercase mb-6">Next drop loading.</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join the list below to be the first to know when tickets go live.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {events.map((e) => {
            const d = formatDate(e.event_date);
            return (
              <div key={e.id} className="bg-background p-6 group">
                <div className="relative aspect-[4/5] mb-6 overflow-hidden bg-secondary">
                  {e.poster_url ? (
                    <img
                      src={e.poster_url}
                      alt={e.title}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                      <span className="font-display text-6xl uppercase text-accent leading-none">
                        {d.short}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-4">
                        {e.venue}
                      </span>
                    </div>
                  )}
                  {e.status === "sold_out" && (
                    <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 font-mono text-[10px] font-bold uppercase">
                      Sold Out
                    </div>
                  )}
                  {e.status === "selling_fast" && (
                    <div className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 font-mono text-[10px] font-bold uppercase">
                      Selling Fast
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-accent uppercase mb-1">
                      {d.long} / {d.time}
                    </p>
                    <h3 className="font-display text-2xl uppercase tracking-tight truncate">
                      {e.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {e.venue}
                      {e.age_restriction ? ` / ${e.age_restriction}` : ""}
                    </p>
                  </div>
                  {e.ticket_url ? (
                    <a
                      href={e.ticket_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Get tickets for ${e.title}`}
                      className="shrink-0 size-8 border border-border flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                    >
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <a
                      href="#rsvp"
                      aria-label={`RSVP for ${e.title}`}
                      className="shrink-0 size-8 border border-border flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                    >
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
                {e.description && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{e.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EventStatusCard({
  label,
  title,
  body = "Join the list below to be the first to know when tickets go live.",
}: {
  label: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="border border-dashed border-border p-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
        {label}
      </p>
      <p className="font-display text-3xl uppercase mb-6">{title}</p>
      <p className="text-muted-foreground max-w-md mx-auto">{body}</p>
    </div>
  );
}

function ApplicationHub() {
  const tracks = [
    {
      id: "intern" as const,
      num: "01",
      cat: "Internships",
      title: "Next Gen",
      desc: "Marketing, content, ops, social media, photo, video, artist relations — for students and early-career talent.",
      cta: "Apply Now",
    },
    {
      id: "freelancer" as const,
      num: "02",
      cat: "Creative",
      title: "Freelance Crew",
      desc: "Photography, videography, design, editing, street team, event staff, security, production. Build with us.",
      cta: "Join the Roster",
    },
    {
      id: "vendor" as const,
      num: "03",
      cat: "Partnership",
      title: "Vendors",
      desc: "Food, drink, clothing, merch, local brands, pop-up shops, sponsors. Activate at our next event.",
      cta: "Pitch Us",
    },
    {
      id: "artist" as const,
      num: "04",
      cat: "Talent",
      title: "DJs & Artists",
      desc: "Submit your sound. Booking opportunities, showcases, collabs, and future lineups.",
      cta: "Submit Music",
    },
  ];
  return (
    <section
      id="apply"
      className="relative px-6 py-24 bg-foreground text-background gradient-divider"
    >
      <div className="max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-background/60 mb-3">
          [ 02 / Work With Us ]
        </p>
        <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-4 leading-none">
          Build the Scene
          <br />
          With Us
        </h2>
        <p className="text-lg mb-16 opacity-70 max-w-2xl">
          OutsideAtl is community-driven. Whether you're behind the decks, behind the lens, or
          behind a brand — we want to hear from you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((t) => (
            <Link
              key={t.id}
              to="/apply/$type"
              params={{ type: t.id }}
              className="border border-background/20 p-8 hover:bg-accent hover:text-accent-foreground transition-colors block"
            >
              <span className="font-mono text-xs uppercase mb-8 block">
                [ {t.num} / {t.cat} ]
              </span>
              <h4 className="font-display text-4xl uppercase mb-4">{t.title}</h4>
              <p className="text-sm mb-8 opacity-80">{t.desc}</p>
              <span className="font-bold uppercase text-xs tracking-widest">{t.cta} →</span>
            </Link>
          ))}
          <Link
            to="/apply/sponsor"
            className="border border-accent/60 bg-accent/10 p-8 hover:bg-accent hover:text-accent-foreground transition-colors block md:col-span-2"
          >
            <span className="font-mono text-xs uppercase mb-8 block">
              [ 05 / Sponsors & Partners ]
            </span>
            <h4 className="font-display text-4xl uppercase mb-4">Partner With OutsideAtl</h4>
            <p className="text-sm mb-8 opacity-80">
              Sponsorship packages, brand activations, in-kind partners, media collabs. Pick a
              package or pitch a custom ask — we tailor every deal.
            </p>
            <span className="font-bold uppercase text-xs tracking-widest">Partner With Us →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function PastRecaps({
  events,
  isLoading,
}: {
  events: Awaited<ReturnType<typeof listPublicEvents>>;
  isLoading: boolean;
}) {
  return (
    <section id="recaps" className="relative px-6 py-24 gradient-divider">
      <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
        [ 03 / Archive ]
      </p>
      <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-12">
        Past Recaps
      </h2>
      {isLoading ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            [ Loading archive ]
          </p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Pulling the latest OutsideAtl recaps.
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            [ Archive being built ]
          </p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Photo + video recaps of past OutsideAtl events will live here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {events.slice(0, 8).map((e) => (
            <div key={e.id} className="aspect-square bg-secondary relative overflow-hidden group">
              {e.poster_url ? (
                <img
                  src={e.poster_url}
                  alt={e.title}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-center">
                  <span className="font-display text-xl uppercase text-muted-foreground">
                    {e.title}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
                <p className="font-mono text-[10px] uppercase text-accent">
                  {formatDate(e.event_date).long}
                </p>
                <p className="font-display uppercase text-sm truncate">{e.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RsvpSection({ events }: { events: Awaited<ReturnType<typeof listPublicEvents>> }) {
  const m = useAsyncMutation<Record<string, string>>(
    (input) => submitRsvp({ ...input, event_id: input.event_id || null }),
    {
      onSuccess: () => toast.success("You're on the list. We'll be in touch."),
      onError: (e: Error) => toast.error(e.message),
    },
  );
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    age_range: "18+",
    social_handle: "",
    college_affiliation: "",
    preferred_event_types: "",
    notes: "",
    event_id: "",
  });
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    m.mutate(form);
  };
  return (
    <section
      id="rsvp"
      className="relative px-6 py-24 gradient-divider bg-secondary/60 backdrop-blur-sm"
    >
      <div className="grid md:grid-cols-2 gap-12 max-w-6xl">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
            [ 04 / Pre-RSVP ]
          </p>
          <h2 className="font-display text-5xl md:text-6xl uppercase tracking-tighter mb-6">
            Lock in your spot.
          </h2>
          <p className="text-muted-foreground mb-6">
            Drop your info to pre-RSVP for upcoming OutsideAtl events. Early-access drops, secret
            locations, and community-only invites go to this list first.
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            [ Free to join. Always. ]
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3" aria-label="Pre-RSVP form">
          <Input
            aria-label="Full name"
            placeholder="Full name *"
            required
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              aria-label="Email"
              type="email"
              placeholder="Email *"
              required
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Input
              aria-label="Phone"
              placeholder="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              aria-label="Age range"
              value={form.age_range}
              onChange={(v) => setForm({ ...form, age_range: v })}
              options={["18+", "21+", "Under 18"]}
            />
            <Input
              aria-label="Instagram handle"
              placeholder="@instagram"
              value={form.social_handle}
              onChange={(v) => setForm({ ...form, social_handle: v })}
            />
          </div>
          <Input
            aria-label="College or community affiliation"
            placeholder="College / community"
            value={form.college_affiliation}
            onChange={(v) => setForm({ ...form, college_affiliation: v })}
          />
          {events.length > 0 && (
            <Select
              aria-label="Event of interest"
              value={form.event_id}
              onChange={(v) => setForm({ ...form, event_id: v })}
              options={[
                { value: "", label: "Interested in: any event" },
                ...events.map((e) => ({ value: e.id, label: e.title })),
              ]}
            />
          )}
          <Input
            aria-label="Preferred event types"
            placeholder="Preferred event types (raves, DJ nights, day parties...)"
            value={form.preferred_event_types}
            onChange={(v) => setForm({ ...form, preferred_event_types: v })}
          />
          <Textarea
            aria-label="Additional notes"
            placeholder="Anything else?"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />
          <button
            disabled={m.isPending}
            className="w-full bg-accent text-accent-foreground font-display text-xl uppercase px-8 py-4 hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {m.isPending ? "Sending..." : "Pre-RSVP"}
          </button>
        </form>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="px-6 py-24 border-b border-border">
      <div className="max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
          [ 05 / About ]
        </p>
        <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-8">
          More than
          <br />
          an event.
        </h2>
        <p className="text-xl text-muted-foreground leading-relaxed mb-6">
          OutsideAtl plans, promotes, and produces high-energy social experiences across Atlanta —
          parties, festivals, concerts, pop-ups, raves, DJ nights, and artist-focused events.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          We're rooted in Atlanta's live music, nightlife, college, and youth culture scene — and we
          partner with venues, sponsors, brands, vendors, and artists to build the city's next
          chapter after dark.
        </p>
      </div>
    </section>
  );
}

function ContactSection() {
  const m = useAsyncMutation<{ name: string; email: string; subject: string; message: string }>(
    (input) => submitContact(input),
    {
      onSuccess: () => {
        toast.success("Message sent. We'll be in touch.");
        setForm({ name: "", email: "", subject: "", message: "" });
      },
      onError: (e: Error) => toast.error(e.message),
    },
  );
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  return (
    <section className="relative px-6 py-24 gradient-divider bg-secondary/60 backdrop-blur-sm">
      <div className="grid md:grid-cols-2 gap-12 max-w-6xl">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
            [ 06 / Partnerships ]
          </p>
          <h2 className="font-display text-5xl md:text-6xl uppercase tracking-tighter mb-6">
            Partner
            <br />
            with us.
          </h2>
          <p className="text-muted-foreground">
            Sponsorships, venue collabs, brand activations, press, or general inquiries — send a
            note and we'll get back to you.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate(form);
          }}
          className="space-y-3"
          aria-label="Contact form"
        >
          <Input
            aria-label="Name"
            placeholder="Name *"
            required
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Input
            aria-label="Email"
            type="email"
            placeholder="Email *"
            required
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Input
            aria-label="Subject"
            placeholder="Subject"
            value={form.subject}
            onChange={(v) => setForm({ ...form, subject: v })}
          />
          <Textarea
            aria-label="Message"
            placeholder="Your message *"
            required
            value={form.message}
            onChange={(v) => setForm({ ...form, message: v })}
            rows={5}
          />
          <button
            disabled={m.isPending}
            className="w-full bg-foreground text-background font-display text-xl uppercase px-8 py-4 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            {m.isPending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const m = useAsyncMutation<{ email: string }>(
    (input) => subscribeNewsletter({ ...input, signup_source: "homepage_deals_private_events" }),
    {
      onSuccess: () => {
        toast.success("You're on the deals and private-events list.");
        setEmail("");
      },
      onError: (e: Error) => toast.error(e.message),
    },
  );
  const [email, setEmail] = useState("");
  return (
    <section className="px-6 py-24 flex flex-col items-center text-center">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
          [ Deals / Private Events ]
        </p>
        <h2 className="font-display text-5xl uppercase tracking-tight mb-6">
          Get the Private Drops
        </h2>
        <p className="text-muted-foreground mb-10">
          Inner-circle drops, secret locations, and community invites — straight to your inbox.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate({ email });
          }}
          className="flex flex-col sm:flex-row gap-2 w-full"
          aria-label="Deals and private events signup"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
            placeholder="EMAIL@ADDRESS.COM"
            className="flex-1 bg-secondary border border-border px-6 py-4 font-mono text-sm focus:border-accent outline-none text-foreground uppercase placeholder:text-muted-foreground"
          />
          <button
            disabled={m.isPending}
            className="bg-accent text-accent-foreground font-display text-xl uppercase px-8 py-4 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {m.isPending ? "..." : "Join"}
          </button>
        </form>
      </div>
    </section>
  );
}

// shared inputs
export function Input({
  value,
  onChange,
  ...rest
}: { value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
      className="w-full bg-background border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none text-foreground placeholder:text-muted-foreground"
    />
  );
}
export function Textarea({
  value,
  onChange,
  rows = 3,
  ...rest
}: { value: string; onChange: (v: string) => void; rows?: number } & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "rows"
>) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      {...rest}
      className="w-full bg-background border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none text-foreground placeholder:text-muted-foreground resize-y"
    />
  );
}
export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-background border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none text-foreground"
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}
