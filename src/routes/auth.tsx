import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { adminLogin } from "@/lib/submissions.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Admin - OutsideAtl" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Admin credentials are verified server-side; only the signed session token is kept client-side.
      const result = await login({ data: { username, password } });
      const token = getAdminLoginToken(result);
      if (!token) throw new Error("Admin login did not return a session.");
      localStorage.setItem("outsideatl_admin_token", token);
      await navigate({ to: "/admin" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      toast.error(message);
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

function getAdminLoginToken(result: unknown) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return null;
  const direct = result as { token?: unknown };
  if (typeof direct.token === "string") return direct.token;
  const nested = result as { data?: { token?: unknown }; result?: { token?: unknown } };
  if (typeof nested.data?.token === "string") return nested.data.token;
  if (typeof nested.result?.token === "string") return nested.result.token;
  return null;
}
