import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArticleCard } from "@/components/site/article-card";
import type { Article } from "@/lib/mock-data";

export const Route = createFileRoute("/articles/")({
  component: ArticlesPage,
});

function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? articles.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      )
    : articles;

  useEffect(() => {
    supabase
      .from("user_articles")
      .select("id, title, excerpt, category, cover_url, slug, created_at, user_id")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) console.error("[articles]", error.message);
        if (!data) { setLoading(false); return; }

        // Fetch profiles separately
        const userIds = [...new Set(data.map((a: any) => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds);

        const profileMap: Record<string, { full_name: string | null; username: string | null }> = {};
        (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

        setArticles(
          data.map((a: any) => {
            const p = profileMap[a.user_id];
            const name = p?.full_name ?? p?.username ?? "Anonymous";
            return {
              slug: a.slug,
              title: a.title,
              excerpt: a.excerpt,
              category: a.category,
              image: a.cover_url ?? "",
              author: {
                name,
                role: "Community writer",
                initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
              },
              date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              readTime: `${Math.max(1, Math.ceil(a.excerpt.split(" ").length / 200))} min read`,
              views: "0",
              likes: "0",
            };
          })
        );
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="mx-auto max-w-3xl py-8 sm:py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">The Library</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-tight text-foreground">
          Every essay, beautifully kept.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
          A growing collection of long-form writing on wellness, design and the quiet practice of living well.
        </p>
        {/* Search bar */}
        <div className="mx-auto mt-7 flex max-w-md items-center gap-3 rounded-full border border-border bg-white/70 px-4 py-2.5 shadow-soft backdrop-blur dark:bg-white/5 dark:border-white/10">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, categories…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass h-80 animate-pulse rounded-[1.75rem] dark:bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 && query.trim() ? (
        <div className="py-24 text-center">
          <p className="text-5xl">🔍</p>
          <p className="mt-4 font-display text-2xl text-foreground">No results for "{query}"</p>
          <p className="mt-2 text-sm text-muted-foreground">Try a different keyword or category.</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-5xl">✍️</p>
          <p className="mt-4 font-display text-2xl text-foreground">No articles yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Be the first to share a story with the community.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
