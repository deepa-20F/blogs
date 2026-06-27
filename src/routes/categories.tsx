import { createFileRoute, Link } from "@tanstack/react-router";
import { categories } from "@/lib/mock-data";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Lumen" },
      { name: "description", content: "Explore Lumen by category — wellness, mindfulness, lifestyle, technology and more." },
      { property: "og:title", content: "Categories — Lumen" },
      { property: "og:description", content: "Explore Lumen by category." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <header className="mx-auto max-w-3xl py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Explore</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-tight">
          A gentle taxonomy.
        </h1>
        <p className="mt-5 text-[16px] text-muted-foreground">
          Every story lives somewhere quiet. Pick a room.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Link
            key={c.name}
            to="/articles"
            className="group glass hover-lift relative overflow-hidden rounded-[1.75rem] p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-2xl shadow-soft">
                  {c.icon}
                </span>
                <h3 className="mt-5 font-display text-2xl text-foreground">{c.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {12 + i * 4} stories
                </p>
              </div>
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-[#3F6E67]/10 grid place-items-center text-4xl transition-transform duration-700 group-hover:scale-105">
                {c.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}