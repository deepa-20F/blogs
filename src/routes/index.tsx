import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { categories, heroImage, stats } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { ArticleCard } from "@/components/site/article-card";
import type { Article } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Stories that inspire better living" },
      {
        name: "description",
        content:
          "Discover essays, ideas and quiet wisdom on wellness, mindful living and modern culture. A premium reading experience by Lumen Editions.",
      },
      { property: "og:title", content: "Lumen — Stories that inspire better living" },
      {
        property: "og:description",
        content: "A premium editorial blog on wellness, mindful living and modern ideas.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const [allArticles, setAllArticles] = useState<Article[]>([]);

  useEffect(() => {
    supabase
      .from("user_articles")
      .select("id, title, excerpt, category, cover_url, slug, created_at, user_id")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error || !data) return;

        // Fetch profiles separately
        const userIds = [...new Set(data.map((a: any) => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds);

        const profileMap: Record<string, { full_name: string | null; username: string | null }> = {};
        (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

        setAllArticles(
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
      });
  }, []);

  const filtered = q.trim()
    ? allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(q.toLowerCase()) ||
          a.category.toLowerCase().includes(q.toLowerCase()) ||
          a.author.name.toLowerCase().includes(q.toLowerCase()),
      )
    : null;

  return (
    <div className="space-y-16 pb-10 sm:space-y-32">
      <Hero />
      <SearchBar q={q} setQ={setQ} />
      {filtered ? (
        <SearchResults q={q} results={filtered} onClear={() => setQ("")} />
      ) : (
        <>
          <CategoryRow />
          <ArticleGrid articles={allArticles} />
          <Newsletter />
        </>
      )}
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] glass-strong dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10 p-8 sm:p-20 text-center">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#CFE8DF] opacity-40 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#D7B66A]/30 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
        <div className="relative">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-[#D7B66A]" /> The Summer Edition · 2026
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,6.2vw,4.4rem)] leading-[1.02] tracking-tight text-foreground">
            Discover{" "}
            <span className="relative inline-block">
              <span className="text-gradient-primary italic">stories</span>
              <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none">
                <path d="M2 8 C 50 2, 150 2, 198 8" fill="none" stroke="#D7B66A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            {" "}that inspire{" "}
            <span className="font-serif-display italic text-[#3F6E67]">better living</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Long-form essays, slow ideas and quiet rituals — curated by writers who believe great writing deserves great design.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/articles" className="gradient-primary group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white shadow-luxe transition-transform hover:scale-[1.03]">
              Explore articles <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/auth" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-foreground transition-all hover:bg-white/80">
              Start writing
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl px-5 py-3 text-center">
                <p className="font-display text-xl text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Search ---------------- */
function SearchBar({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const suggestions = ["morning rituals", "ai for writers", "summer nutrition", "calm workspace"];
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="glass-strong relative flex items-center gap-2 rounded-full p-2 pl-5 shadow-luxe dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10"
      >
        <Search className="h-5 w-5 shrink-0 text-foreground/60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search essays, authors, categories…"
          className="h-12 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        <button
          type="submit"
          className="gradient-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.04]"
        >
          Search
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2 px-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setQ(s)}
            className="rounded-full bg-white/60 px-3 py-1 text-xs text-foreground/70 transition-colors hover:bg-white hover:text-foreground dark:bg-white/10 dark:hover:bg-white/20"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Search Results ---------------- */
function SearchResults({
  q,
  results,
  onClear,
}: {
  q: string;
  results: Article[];
  onClear: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Results</p>
          <h2 className="mt-1 font-display text-2xl text-foreground">
            {results.length > 0
              ? `${results.length} result${results.length > 1 ? "s" : ""} for "${q}"`
              : `No results for "${q}"`}
          </h2>
        </div>
        <button
          onClick={onClear}
          className="rounded-full bg-white/60 px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-white hover:text-foreground dark:bg-white/10 dark:hover:bg-white/20"
        >
          Clear
        </button>
      </div>
      {results.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-5xl">🔍</p>
          <p className="mt-4 text-lg font-display text-foreground">Nothing found</p>
          <p className="mt-2 text-sm">Try a different keyword or browse categories below.</p>
        </div>
      )}
    </section>
  );
}

/* ---------------- Categories ---------------- */
function CategoryRow() {
  const [active, setActive] = useState("Wellness");
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Browse</p>
          <h2 className="mt-2 font-display text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight text-foreground">
            A library, gently organised
          </h2>
        </div>
        <Link to="/categories" className="hidden text-sm font-semibold text-foreground/70 hover:text-foreground sm:inline-flex sm:items-center sm:gap-1">
          View all <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {categories.map((c) => {
          const isActive = active === c.name;
          return (
            <button
              key={c.name}
              onClick={() => setActive(c.name)}
              className={
                "group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 " +
                (isActive
                  ? "gradient-primary text-white shadow-luxe"
                  : "glass text-foreground/80 hover:text-foreground")
              }
            >
              <span className="text-base">{c.icon}</span>
              {c.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Article grid ---------------- */
function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Latest</p>
          <h2 className="mt-2 font-display text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight text-foreground">
            Fresh from the desk
          </h2>
        </div>
        <Link to="/articles" className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-white dark:bg-white/10 dark:hover:bg-white/20">
          All articles <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      {articles.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">✍️</p>
          <p className="mt-4 font-display text-xl text-foreground">No articles yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Be the first to write one.</p>
          <Link to="/profile" className="gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft">
            Start writing
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Newsletter ---------------- */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="glass-strong noise relative overflow-hidden rounded-[2rem] p-7 sm:p-16">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#CFE8DF] opacity-60 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[#EAE7F8] opacity-60 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
        <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-[#D7B66A]/30 blur-2xl animate-pulse-glow" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#D7B66A]" /> Weekly Edit
            </span>
            <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] text-foreground">
              Stay updated.<br />
              <span className="font-serif-display italic text-[#3F6E67]">Quietly.</span>
            </h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
              Three essays, one ritual and a beautifully composed letter — every Sunday morning.
              No noise. Unsubscribe in a click.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setDone(true);
            }}
            className="glass flex w-full items-center gap-2 rounded-full p-2 pl-5"
          >
            <input
              type="email"
              required
              placeholder="you@beautiful.email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button
              type="submit"
              className="gradient-primary rounded-full px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]"
            >
              {done ? "✓ Subscribed" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
