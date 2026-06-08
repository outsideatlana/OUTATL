import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error?: Error;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[App] render failed:", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
        <section className="w-full max-w-2xl border border-border bg-background/90 p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            [ Page Error ]
          </p>
          <h1 className="font-display text-5xl uppercase tracking-tight mb-4">
            OutsideAtl could not load.
          </h1>
          <p className="text-muted-foreground mb-8">
            Refresh the page and try again. If it keeps happening, the details below will help us
            fix it fast.
          </p>
          <pre className="max-h-48 overflow-auto border border-border bg-secondary p-4 text-xs text-muted-foreground whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            className="mt-8 bg-accent text-accent-foreground px-8 py-4 font-display text-xl uppercase tracking-tight hover:scale-[1.02] transition-transform"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </section>
      </main>
    );
  }
}

export function AppLoadingFallback() {
  return (
    <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
      <section className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          [ Loading OutsideAtl ]
        </p>
        <h1 className="font-display text-5xl uppercase tracking-tight">One sec.</h1>
      </section>
    </main>
  );
}
