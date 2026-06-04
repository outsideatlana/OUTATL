import { AppLink as Link } from "@/components/app-link";
import { adminLogin } from "@/lib/api";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { token } = await adminLogin({ username, password });
      window.localStorage.setItem("outsideatl_admin_token", token);
      window.location.href = "/admin";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
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
          ← Back
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
            type="text"
            required
            autoComplete="username"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-secondary/80 backdrop-blur border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary/80 backdrop-blur border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
          />
          <button
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-display text-xl uppercase py-4 disabled:opacity-50 shadow-[0_0_40px_hsl(220_90%_40%/0.4)]"
          >
            {loading ? "..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
