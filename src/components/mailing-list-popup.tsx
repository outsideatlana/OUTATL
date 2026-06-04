import { useEffect, useState, type FormEvent } from "react";
import { subscribeNewsletter } from "@/lib/api";
import { useAsyncMutation } from "@/lib/useAsyncMutation";
import { toast } from "sonner";

const STORAGE_KEY = "outsideatl_mailing_popup_dismissed";
const DELAY_MS = 105_000; // 1m 45s
const SCROLL_TARGET_ID = "events"; // Upcoming Drops section

export function MailingListPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const m = useAsyncMutation<string>(
    (e) => subscribeNewsletter({ email: e, signup_source: "mailing_list_popup" }),
    {
      onSuccess: () => {
        toast.success("You're on the list.");
        dismiss();
      },
      onError: (e: Error) => toast.error(e.message),
    },
  );

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage can be unavailable in private browsing; dismissal should still work for this view.
    }
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // If sessionStorage is blocked, fall through and allow the popup trigger.
    }

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setOpen(true);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };

    const timer = setTimeout(trigger, DELAY_MS);

    const target = document.getElementById(SCROLL_TARGET_ID);
    const onScroll = () => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      // Fired once user has scrolled past the bottom of the Upcoming Drops section
      if (rect.bottom < window.innerHeight * 0.5) trigger();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    m.mutate(email);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mailing-popup-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-background border border-accent shadow-[0_0_60px_hsl(220_90%_40%/0.4)] p-8 animate-[slide-up_0.4s_var(--ease-out-expo,ease-out)_both]"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 size-8 flex items-center justify-center font-mono text-lg text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
          [ Don't miss the next drop ]
        </p>
        <h2
          id="mailing-popup-title"
          className="font-display text-4xl uppercase tracking-tighter leading-none mb-4"
        >
          Join the
          <br />
          Mailing List
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Early-access drops, secret locations, and community-only invites — straight to your inbox.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="your@email.com"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={m.isPending}
            className="w-full bg-accent text-accent-foreground font-display text-lg uppercase tracking-tight px-6 py-3 hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {m.isPending ? "Joining..." : "I'm In"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="w-full font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground py-2"
          >
            [ No thanks ]
          </button>
        </form>
      </div>
    </div>
  );
}
