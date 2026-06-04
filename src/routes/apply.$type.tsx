import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { submitApplication } from "@/lib/submissions.functions";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Input, Textarea, Select } from "@/routes/index";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

type AppType = "intern" | "freelancer" | "vendor" | "artist";

const META: Record<AppType, { title: string; tagline: string; num: string; roles: string[] }> = {
  intern: {
    title: "Intern Application",
    tagline: "Students and early-career applicants in event planning, marketing, social, content, ops, promotions, photo, video, hospitality, and artist relations.",
    num: "01",
    roles: ["Event Planning", "Marketing", "Social Media", "Content Creation", "Operations", "Promotions", "Photography", "Videography", "Hospitality", "Artist Relations"],
  },
  freelancer: {
    title: "Freelancer Application",
    tagline: "Independent creatives and contractors who can support our events.",
    num: "02",
    roles: ["Photography", "Videography", "Graphic Design", "Editing", "Street Team", "Event Staffing", "Security Support", "Production", "Marketing"],
  },
  vendor: {
    title: "Vendor Application",
    tagline: "Food, drink, clothing, merch, local brands, sponsors, and pop-up shops looking to activate at OutsideAtl events.",
    num: "03",
    roles: ["Food", "Drink", "Clothing", "Merch", "Local Business", "Sponsor", "Pop-Up Shop"],
  },
  artist: {
    title: "DJ / Artist Submission",
    tagline: "DJs, performers, producers, and artists — submit for booking, showcases, collaborations, and lineups.",
    num: "04",
    roles: ["DJ", "Live Artist", "Producer", "Performer", "Band"],
  },
};

export const Route = createFileRoute("/apply/$type")({
  beforeLoad: ({ params }) => {
    if (!["intern", "freelancer", "vendor", "artist"].includes(params.type)) throw notFound();
  },
  head: ({ params }) => {
    const t = params.type as AppType;
    const m = META[t];
    return { meta: [
      { title: `${m.title} — OutsideAtl` },
      { name: "description", content: m.tagline },
      { property: "og:title", content: `${m.title} — OutsideAtl` },
      { property: "og:description", content: m.tagline },
    ]};
  },
  component: ApplyPage,
});

function ApplyPage() {
  const { type } = Route.useParams();
  const t = type as AppType;
  const meta = META[t];
  const fn = useServerFn(submitApplication);
  const m = useMutation({
    mutationFn: (input: typeof form) => fn({ data: input }),
    onSuccess: () => { toast.success("Application submitted. We'll review and reach out."); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const initial = {
    application_type: t,
    full_name: "", stage_name: "", email: "", phone: "",
    instagram: "", tiktok: "", portfolio_url: "", music_url: "",
    preferred_role: meta.roles[0] ?? "", experience_level: "Intermediate",
    genre: "", past_experience: "", expected_rate: "",
    preferred_event_type: "", availability: "", message: "",
  };
  const [form, setForm] = useState(initial);
  const reset = () => setForm({ ...initial, application_type: t });
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    m.mutate(form);
  };

  const isArtist = t === "artist";

  return (
    <div className="min-h-screen text-foreground">
      <SiteNav />
      <section className="relative px-6 py-20 md:py-28 gradient-divider overflow-hidden">
        <div className="hero-glow z-0 opacity-50" />
        <div className="hero-radial z-0 opacity-60" />
        <div className="relative z-10 max-w-3xl">
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">← Back</Link>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mt-8 mb-3">[ {meta.num} / Apply ]</p>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-6"
            style={{ textShadow: "0 0 60px hsl(220 90% 40% / 0.4)" }}>{meta.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{meta.tagline}</p>
        </div>
      </section>


      <section className="relative px-6 py-16">
        <form onSubmit={onSubmit} className="max-w-3xl space-y-4">
          <Field label="Full name *"><Input required value={form.full_name} onChange={set("full_name")} /></Field>
          {isArtist && <Field label="Stage name *"><Input required value={form.stage_name} onChange={set("stage_name")} /></Field>}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email *"><Input type="email" required value={form.email} onChange={set("email")} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set("phone")} /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Instagram"><Input placeholder="@handle" value={form.instagram} onChange={set("instagram")} /></Field>
            <Field label="TikTok"><Input placeholder="@handle" value={form.tiktok} onChange={set("tiktok")} /></Field>
          </div>
          <Field label="Portfolio / work samples (URL)"><Input type="url" placeholder="https://..." value={form.portfolio_url} onChange={set("portfolio_url")} /></Field>
          {isArtist && (
            <>
              <Field label="Music link (SoundCloud, Spotify, Mixcloud)">
                <Input type="url" placeholder="https://..." value={form.music_url} onChange={set("music_url")} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Genre"><Input placeholder="House, Trap, Techno..." value={form.genre} onChange={set("genre")} /></Field>
                <Field label="Expected rate"><Input placeholder="$ or negotiable" value={form.expected_rate} onChange={set("expected_rate")} /></Field>
              </div>
              <Field label="Preferred event type">
                <Input placeholder="Rave, day party, festival, showcase..." value={form.preferred_event_type} onChange={set("preferred_event_type")} />
              </Field>
            </>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label={isArtist ? "Performance type" : "Preferred role"}>
              <Select value={form.preferred_role} onChange={set("preferred_role")} options={meta.roles} />
            </Field>
            <Field label="Experience level">
              <Select value={form.experience_level} onChange={set("experience_level")} options={["Beginner", "Intermediate", "Experienced", "Professional"]} />
            </Field>
          </div>
          <Field label="Availability"><Input placeholder="Weekends, evenings, etc." value={form.availability} onChange={set("availability")} /></Field>
          <Field label={isArtist ? "Past performance experience" : "Past experience"}>
            <Textarea rows={4} value={form.past_experience} onChange={set("past_experience")} />
          </Field>
          <Field label="Why do you want to work with OutsideAtl?">
            <Textarea rows={4} value={form.message} onChange={set("message")} />
          </Field>
          <button disabled={m.isPending} className="w-full md:w-auto bg-accent text-accent-foreground font-display text-xl uppercase px-12 py-4 hover:scale-[1.01] transition-transform disabled:opacity-50 shadow-[0_0_40px_hsl(220_90%_40%/0.4)]">
            {m.isPending ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">{label}</span>
      {children}
    </label>
  );
}
