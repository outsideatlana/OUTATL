import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { submitApplication } from "@/lib/submissions.functions";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Input, Textarea, Select } from "@/routes/index";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const PACKAGES = [
  "Title Sponsor",
  "Presenting Partner",
  "Stage / Activation Sponsor",
  "Bar / Beverage Partner",
  "Brand Activation Booth",
  "Media / Content Partner",
  "In-Kind Partner",
  "Custom — let's talk",
];

const OUTREACH = ["Email", "Phone call", "Text / SMS", "Instagram DM", "Schedule a meeting"];

const HEAD = {
  title: "Sponsor & Partnership Application — OutsideAtl",
  description: "Brands, agencies, and partners — sponsor an OutsideAtl event. Pick a package or pitch a custom collaboration.",
};

export const Route = createFileRoute("/apply/sponsor")({
  head: () => ({ meta: [
    { title: HEAD.title },
    { name: "description", content: HEAD.description },
    { property: "og:title", content: HEAD.title },
    { property: "og:description", content: HEAD.description },
  ]}),
  component: SponsorPage,
});

function SponsorPage() {
  const fn = useServerFn(submitApplication);

  const initial = {
    company_name: "",
    website: "",
    full_name: "",
    contact_role: "",
    email: "",
    phone: "",
    instagram: "",
    package: PACKAGES[0],
    custom_ask: "",
    budget: "",
    goals: "",
    preferred_event_type: "",
    availability: "",
    outreach_preference: OUTREACH[0],
    message: "",
  };
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const m = useMutation({
    mutationFn: () => fn({ data: {
      application_type: "sponsor",
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      instagram: form.instagram,
      preferred_role: form.package,
      preferred_event_type: form.preferred_event_type,
      availability: form.availability,
      message: form.message,
      extra: {
        company_name: form.company_name,
        website: form.website,
        contact_role: form.contact_role,
        package: form.package,
        custom_ask: form.custom_ask,
        budget: form.budget,
        goals: form.goals,
        outreach_preference: form.outreach_preference,
      },
    } }),
    onSuccess: () => { toast.success("Thanks — we'll be in touch within 2 business days."); setForm(initial); },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };

  return (
    <div className="min-h-screen text-foreground">
      <SiteNav />
      <section className="relative px-6 py-20 md:py-28 gradient-divider overflow-hidden">
        <div className="hero-glow z-0 opacity-50" />
        <div className="hero-radial z-0 opacity-60" />
        <div className="relative z-10 max-w-3xl">
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">← Back</Link>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mt-8 mb-3">[ 05 / Partner With Us ]</p>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-6"
            style={{ textShadow: "0 0 60px hsl(220 90% 40% / 0.4)" }}>Sponsors & Partners</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Activate your brand alongside Atlanta's after-hours. Pick a package below or pitch a custom collab — we tailor every partnership to your goals.
          </p>
        </div>
      </section>

      <section className="relative px-6 py-16">
        <form onSubmit={onSubmit} className="max-w-3xl space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent">[ Company ]</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Company / Brand *"><Input required value={form.company_name} onChange={set("company_name")} /></Field>
            <Field label="Website"><Input type="url" placeholder="https://..." value={form.website} onChange={set("website")} /></Field>
          </div>

          <h2 className="font-mono text-xs uppercase tracking-widest text-accent pt-6">[ Primary Contact ]</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Your name *"><Input required value={form.full_name} onChange={set("full_name")} /></Field>
            <Field label="Title / Role"><Input placeholder="Marketing Manager, Founder..." value={form.contact_role} onChange={set("contact_role")} /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email *"><Input type="email" required value={form.email} onChange={set("email")} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set("phone")} /></Field>
          </div>
          <Field label="Instagram"><Input placeholder="@brand" value={form.instagram} onChange={set("instagram")} /></Field>

          <h2 className="font-mono text-xs uppercase tracking-widest text-accent pt-6">[ Partnership ]</h2>
          <Field label="Package interest *">
            <Select value={form.package} onChange={set("package")} options={PACKAGES} />
          </Field>
          {form.package === "Custom — let's talk" && (
            <Field label="Describe your custom ask *">
              <Textarea required rows={3} placeholder="What kind of collab do you have in mind?" value={form.custom_ask} onChange={set("custom_ask")} />
            </Field>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Budget range"><Input placeholder="$2k–$5k, flexible, in-kind, etc." value={form.budget} onChange={set("budget")} /></Field>
            <Field label="Preferred event type"><Input placeholder="Rave, day party, festival..." value={form.preferred_event_type} onChange={set("preferred_event_type")} /></Field>
          </div>
          <Field label="Goals for this partnership *">
            <Textarea required rows={4} placeholder="Brand awareness, product sampling, leads, content, community, launch..." value={form.goals} onChange={set("goals")} />
          </Field>
          <Field label="Timing / availability"><Input placeholder="Q1 2026, next 3 months, specific event date..." value={form.availability} onChange={set("availability")} /></Field>

          <h2 className="font-mono text-xs uppercase tracking-widest text-accent pt-6">[ Outreach ]</h2>
          <Field label="Preferred way to be contacted">
            <Select value={form.outreach_preference} onChange={set("outreach_preference")} options={OUTREACH} />
          </Field>
          <Field label="Anything else we should know?">
            <Textarea rows={4} value={form.message} onChange={set("message")} />
          </Field>

          <button disabled={m.isPending} className="w-full md:w-auto bg-accent text-accent-foreground font-display text-xl uppercase px-12 py-4 hover:scale-[1.01] transition-transform disabled:opacity-50 shadow-[0_0_40px_hsl(220_90%_40%/0.4)]">
            {m.isPending ? "Submitting..." : "Submit Partnership Inquiry"}
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
