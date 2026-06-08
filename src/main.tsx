import React from "react";
import ReactDOM from "react-dom/client";
import { Suspense } from "react";
import { AppErrorBoundary, AppLoadingFallback } from "@/components/app-error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={<AppLoadingFallback />}>
        <App />
      </Suspense>
    </AppErrorBoundary>
    <Toaster />
  </React.StrictMode>,
);
