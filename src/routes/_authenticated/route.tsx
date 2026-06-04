import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const token = localStorage.getItem("outsideatl_admin_token");
    if (!token) throw redirect({ to: "/auth" });
    return { user: { id: "admin" } };
  },
  component: () => <Outlet />,
});
