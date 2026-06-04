import HomePage from "@/routes/index";
import ApplyPage, { type AppType } from "@/routes/apply.$type";
import SponsorPage from "@/routes/apply.sponsor";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";

const applicationTypes = ["intern", "freelancer", "vendor", "artist"] as const;

export function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/auth") return <AuthPage />;
  if (path === "/admin") return <AdminPage />;
  if (path === "/apply/sponsor") return <SponsorPage />;

  const applyMatch = path.match(/^\/apply\/([^/]+)$/);
  if (applyMatch && applicationTypes.includes(applyMatch[1] as AppType)) {
    return <ApplyPage type={applyMatch[1] as AppType} />;
  }

  return <HomePage />;
}
