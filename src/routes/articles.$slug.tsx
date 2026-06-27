import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bookmark, Eye, Heart, Share2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useArticleActions } from "@/hooks/use-article-actions";

export const Route = createFileRoute("/articles/$slug")({
  head: () => ({ meta: [{ title: "Article — Lumen" }] }),
  component: ArticlePage,
});

type UserArticle = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_url: string | null;
  slug: string;
  created_at: string;
  profiles: { full_name: string | null; username: string | null } | null;
};

function ArticlePage() {
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<UserArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<UserArticle[]>([]);

  const { viewCount, likeCount, liked, saved, trackView, toggleLike, toggleSave, isLoggedIn } =
    useArticleActions(slug);
  const tracked = useRef(false);

  useEffect(() => {
    setLoading(true);
    setArticle(null);
    tracked.current = false;

    supabase
      .from("user_articles")
      .select("id, title, excerpt, content, category, cover_url, slug, created_at, user_id")
      .eq("slug", slug)
      .eq("published", true)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { setLoading(false); return; }

        // Fetch author profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", data.user_id)
          .single();

        const articleWithProfile = {
          ...data,
          profiles: profile ?? null,
        } as UserArticle;

        setArticle(articleWithProfile);
        setLoading(false);

        if (!tracked.current) {
          tracked.current = true;
          trackView();
        }

        // Load related articles
        supabase
          .from("user_articles")
          .select("id, title, excerpt, category, cover_url, slug, created_at, user_id")
          .eq("published", true)
          .neq("slug", slug)
          .order("created_at", { ascending: false })
          .limit(3)
          .then(async ({ data: relData }) => {
            if (!relData) return;
            const relUserIds = [...new Set(relData.map((a: any) => a.user_id))];
            const { data: relProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, username")
              .in("id", relUserIds);
            const pm: Record<string, any> = {};
            (relProfiles ?? []).forEach((p: any) => { pm[p.id] = p; });
            setRelated(relData.map((a: any) => ({ ...a, profiles: pm[a.user_id] ?? null })) as UserArticle[]);
          });
      });
  }, [slug]);

  const authorName = article?.profiles?.full_name ?? article?.profiles?.username ?? "Anonymous";
  const authorInitials = authorName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const date = article ? new Date(article.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-foreground">Story not found</h1>
        <p className="mt-3 text-muted-foreground">It may have been moved or removed.</p>
        <Link to="/articles" className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm text-background">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      {/* Header */}
      <header className="mt-6 text-center">
        <span className="rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
          {article.category}
        </span>
        <h1 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-foreground">
          {article.title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
        <div className="mt-7 flex items-center justify-center gap-3 text-sm">
          <span className="gradient-primary grid h-10 w-10 place-items-center rounded-full text-xs font-semibold text-white">
            {authorInitials}
          </span>
          <div className="text-left leading-tight">
            <p className="font-semibold text-foreground">{authorName}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </header>

      {/* Cover image */}
      {article.cover_url && (
        <div className="relative mt-10 overflow-hidden rounded-[2rem] shadow-luxe">
          <img src={article.cover_url} alt={article.title} className="aspect-[16/10] w-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="relative mx-auto mt-12 max-w-2xl text-[17px] leading-[1.85] text-foreground/85">
        {article.content.split("\n\n").map((para, i) => (
          <p key={i} className={`${i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.85] first-letter:text-[#3F6E67]" : "mt-6"}`}>
            {para}
          </p>
        ))}
      </div>

      {/* Actions bar */}
      <div className="mx-auto mt-12 flex max-w-2xl items-center justify-between border-y border-black/5 dark:border-white/10 py-5">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLike}
            title={!isLoggedIn ? "Sign in to like" : undefined}
            className={`glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${liked ? "text-red-500" : "text-foreground/80 hover:text-foreground"}`}
          >
            <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
            {likeCount}
          </button>
          <button
            onClick={toggleSave}
            title={!isLoggedIn ? "Sign in to save" : undefined}
            className={`glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${saved ? "text-[#D7B66A]" : "text-foreground/80 hover:text-foreground"}`}
          >
            <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
            Save
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/80 hover:text-foreground"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> {viewCount} reads
        </p>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl text-foreground">Keep reading</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <Link
                key={a.slug}
                to="/articles/$slug"
                params={{ slug: a.slug }}
                className="group glass hover-lift flex flex-col overflow-hidden rounded-[1.75rem] p-3"
              >
                {a.cover_url && (
                  <div className="overflow-hidden rounded-[1.4rem]">
                    <img src={a.cover_url} alt={a.title} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3F6E67]">{a.category}</p>
                  <h3 className="mt-1 font-display text-lg leading-snug text-foreground group-hover:text-[#3F6E67] line-clamp-2">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
