import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, LogOut, Mail, Save, Sparkles, Ticket, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { getMemberProfile, updateMemberProfile } from "@/lib/member.functions";
import { subscribeNewsletter } from "@/lib/submissions.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/member")({
  head: () => ({
    meta: [
      { title: "Member Access - OutsideAtl" },
      {
        name: "description",
        content:
          "Sign up or log in to OutsideAtl member access for discounts, private events, first notices, and the mail list.",
      },
    ],
  }),
  component: MemberPage,
});

type MemberProfile = Awaited<ReturnType<typeof getMemberProfile>>;

const defaultPrefs = {
  wants_discounts: true,
  wants_private_events: true,
  wants_first_notices: true,
  joined_mail_list: true,
};

function MemberPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.session));
      setSessionReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      qc.invalidateQueries({ queryKey: ["member-profile"] });
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [qc]);

  return (
    <div className="min-h-screen text-foreground">
      <SiteNav />
      <main className="px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <MemberPitch />
          {!sessionReady ? (
            <div className="border border-border p-8 text-muted-foreground">Loading...</div>
          ) : signedIn ? (
            <MemberDashboard onSignedOut={() => setSignedIn(false)} />
          ) : (
            <MemberAuth onSignedIn={() => setSignedIn(true)} />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MemberPitch() {
  const perks = [
    { icon: Ticket, title: "Discounts", body: "Member codes and early ticket breaks." },
    { icon: Sparkles, title: "Private Events", body: "Hidden drops, invite-only rooms, soft launches." },
    { icon: Mail, title: "First Notices", body: "Lineups, locations, and drops before the feed." },
  ];
  return (
    <section className="lg:sticky lg:top-24">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
        [ Member Access ]
      </p>
      <h1 className="font-display text-5xl uppercase leading-none tracking-tight md:text-7xl">
        Get Inside
        <br />
        the Drop.
      </h1>
      <p className="mt-6 max-w-xl text-muted-foreground">
        Create an OutsideAtl account for discounts, private-event access, first notices, and the
        mail-list without chasing every announcement across socials.
      </p>
      <div className="mt-10 grid gap-3">
        {perks.map((perk) => (
          <div key={perk.title} className="border border-border bg-secondary/50 p-4">
            <div className="flex items-start gap-3">
              <perk.icon className="mt-1 size-5 text-accent" />
              <div>
                <h2 className="font-display text-2xl uppercase">{perk.title}</h2>
                <p className="text-sm text-muted-foreground">{perk.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MemberAuth({ onSignedIn }: { onSignedIn: () => void }) {
  const saveProfile = useServerFn(updateMemberProfile);
  const joinList = useServerFn(subscribeNewsletter);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    ...defaultPrefs,
  });

  const auth = useMutation({
    mutationFn: async () => {
      const email = form.email.trim().toLowerCase();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: { data: { full_name: form.full_name.trim() } },
        });
        if (error) throw new Error(error.message);
        if (form.joined_mail_list) {
          await joinList({
            data: {
              email,
              signup_source: "member_signup",
              consent_marketing: true,
            },
          });
        }
        if (!data.session) return "confirm";
        await saveProfile({ data: toProfileInput(form) });
        return "signed-in";
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) throw new Error(error.message);
      return "signed-in";
    },
    onSuccess: (result) => {
      if (result === "confirm") {
        toast.success("Check your email to confirm your account.");
        setMode("login");
        return;
      }
      toast.success("You're in.");
      onSignedIn();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="border border-border bg-secondary/50 p-5 md:p-8">
      <div className="mb-6 flex gap-1 border border-border p-1">
        {(["signup", "login"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`flex-1 px-4 py-3 font-mono text-xs uppercase tracking-widest ${
              mode === item ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            {item === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          auth.mutate();
        }}
        className="space-y-3"
      >
        {mode === "signup" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              placeholder="Full name"
              value={form.full_name}
              onChange={(full_name) => setForm({ ...form, full_name })}
            />
            <Field
              placeholder="Phone"
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
            />
          </div>
        )}
        <Field
          type="email"
          required
          placeholder="Email *"
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
        />
        <Field
          type="password"
          required
          minLength={6}
          placeholder="Password *"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
        />
        {mode === "signup" && (
          <PreferenceGrid
            values={form}
            onChange={(key, value) => setForm({ ...form, [key]: value })}
          />
        )}
        <button
          disabled={auth.isPending}
          className="flex w-full items-center justify-center gap-2 bg-accent px-8 py-4 font-display text-xl uppercase text-accent-foreground disabled:opacity-50"
        >
          {auth.isPending ? <Loader2 className="size-5 animate-spin" /> : <UserRound className="size-5" />}
          {mode === "signup" ? "Create Access" : "Enter"}
        </button>
      </form>
    </section>
  );
}

function MemberDashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const getProfile = useServerFn(getMemberProfile);
  const saveProfile = useServerFn(updateMemberProfile);
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["member-profile"],
    queryFn: () => getProfile(),
  });
  const [draft, setDraft] = useState<MemberProfile | null>(null);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const save = useMutation({
    mutationFn: () => saveProfile({ data: toProfileInput(draft) }),
    onSuccess: () => {
      toast.success("Preferences saved.");
      qc.invalidateQueries({ queryKey: ["member-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    onSignedOut();
  };

  if (isLoading || !draft) {
    return <div className="border border-border p-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <section className="border border-border bg-secondary/50 p-5 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">[ Active ]</p>
          <h2 className="font-display text-4xl uppercase">Member Account</h2>
          <p className="text-sm text-muted-foreground">{draft.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 border border-border px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            placeholder="Full name"
            value={draft.full_name ?? ""}
            onChange={(full_name) => setDraft({ ...draft, full_name })}
          />
          <Field
            placeholder="Phone"
            value={draft.phone ?? ""}
            onChange={(phone) => setDraft({ ...draft, phone })}
          />
        </div>
        <PreferenceGrid
          values={draft}
          onChange={(key, value) => setDraft({ ...draft, [key]: value })}
        />
        <MemberPerks profile={draft} />
        <button
          disabled={save.isPending}
          className="flex w-full items-center justify-center gap-2 bg-accent px-8 py-4 font-display text-xl uppercase text-accent-foreground disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          Save Preferences
        </button>
      </form>
    </section>
  );
}

function MemberPerks({ profile }: { profile: MemberProfile }) {
  const unlocked = useMemo(
    () => [
      profile.wants_discounts && "Discount drops enabled",
      profile.wants_private_events && "Private invites enabled",
      profile.wants_first_notices && "First notices enabled",
      profile.joined_mail_list && "Mail-list active",
    ].filter(Boolean),
    [profile],
  );
  return (
    <div className="border border-border bg-background p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Access
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {unlocked.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-accent" />
            {item}
          </div>
        ))}
      </div>
      <Link
        to="/"
        hash="events"
        className="mt-5 inline-block font-mono text-xs uppercase tracking-widest text-accent"
      >
        View upcoming drops
      </Link>
    </div>
  );
}

function PreferenceGrid({
  values,
  onChange,
}: {
  values: typeof defaultPrefs;
  onChange: (key: keyof typeof defaultPrefs, value: boolean) => void;
}) {
  const prefs = [
    ["wants_discounts", "Discounts"] as const,
    ["wants_private_events", "Private events"] as const,
    ["wants_first_notices", "First notices"] as const,
    ["joined_mail_list", "Mail-list"] as const,
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {prefs.map(([key, label]) => (
        <label
          key={key}
          className="flex cursor-pointer items-center justify-between gap-3 border border-border bg-background px-4 py-3 font-mono text-xs uppercase tracking-widest"
        >
          {label}
          <input
            type="checkbox"
            checked={values[key]}
            onChange={(event) => onChange(key, event.target.checked)}
            className="size-4 accent-accent"
          />
        </label>
      ))}
    </div>
  );
}

function Field({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
    />
  );
}

function toProfileInput(
  input:
    | typeof defaultPrefs
    | (Partial<MemberProfile> & {
        full_name?: string | null;
        phone?: string | null;
      })
    | null,
) {
  return {
    full_name: input?.full_name ?? "",
    phone: input?.phone ?? "",
    wants_discounts: input?.wants_discounts ?? true,
    wants_private_events: input?.wants_private_events ?? true,
    wants_first_notices: input?.wants_first_notices ?? true,
    joined_mail_list: input?.joined_mail_list ?? true,
  };
}
