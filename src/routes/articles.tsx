import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles — Lumen" },
      { name: "description", content: "Browse essays and stories from Lumen Editions." },
    ],
  }),
  component: () => <Outlet />,
});
