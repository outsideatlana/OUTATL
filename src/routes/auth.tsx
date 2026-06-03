import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Admin - OutsideAtl" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid place-items-center px-6 overflow-hidden">
      <div className="hero-glow z-0 opacity-60" />
      <div className="hero-radial z-0 opacity-70" />
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          Back
        </Link>
        <h1
          className="font-display text-5xl uppercase mt-8 mb-2"
          style={{ textShadow: "0 0 60px hsl(220 90% 40% / 0.4)" }}
        >
          Outside<span className="text-accent">Atl</span>
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-10">
          [ Admin Portal ]
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary/80 backdrop-blur border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary/80 backdrop-blur border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
          />
          <button
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-display text-xl uppercase py-4 disabled:opacity-50 shadow-[0_0_40px_hsl(220_90%_40%/0.4)]"
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          [ {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"} ]
        </button>
      </div>
    </div>
  );
}
