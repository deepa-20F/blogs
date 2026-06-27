import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useArticleActions(slug: string) {
  const { user } = useAuth();

  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const viewTracked = useRef<string | null>(null); // tracks which slug has been counted

  // Load counts + user state on mount / slug change
  useEffect(() => {
    if (!slug) return;

    // Reset tracked ref when slug changes so new article page gets counted
    viewTracked.current = null;

    // View count (read only — no increment here)
    supabase
      .from("article_views")
      .select("view_count")
      .eq("slug", slug)
      .single()
      .then(({ data }) => { if (data) setViewCount(data.view_count); });

    // Like count
    supabase
      .from("article_likes")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug)
      .then(({ count }) => { if (count !== null) setLikeCount(count); });

    if (user) {
      supabase
        .from("article_likes")
        .select("id")
        .eq("slug", slug)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setLiked(!!data));

      supabase
        .from("saved_articles")
        .select("id")
        .eq("slug", slug)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setSaved(!!data));
    }
  }, [slug, user?.id]);

  // Increment view — only fires once per slug per page visit
  // Must be called explicitly from the article detail page only
  async function trackView() {
    if (viewTracked.current === slug) return; // already counted this slug
    viewTracked.current = slug;
    try {
      await supabase.rpc("increment_view", { p_slug: slug });
      setViewCount((v) => v + 1);
    } catch {
      // silently ignore if table doesn't exist yet
    }
  }

  // Toggle like
  async function toggleLike() {
    if (!user) return;
    if (liked) {
      await supabase
        .from("article_likes")
        .delete()
        .eq("slug", slug)
        .eq("user_id", user.id);
      setLiked(false);
      setLikeCount((v) => Math.max(0, v - 1));
    } else {
      await supabase
        .from("article_likes")
        .insert({ slug, user_id: user.id });
      setLiked(true);
      setLikeCount((v) => v + 1);
    }
  }

  // Toggle save
  async function toggleSave() {
    if (!user) return;
    if (saved) {
      await supabase
        .from("saved_articles")
        .delete()
        .eq("slug", slug)
        .eq("user_id", user.id);
      setSaved(false);
    } else {
      await supabase
        .from("saved_articles")
        .insert({ slug, user_id: user.id });
      setSaved(true);
    }
  }

  function formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  return {
    viewCount: formatCount(viewCount),
    likeCount: formatCount(likeCount),
    liked,
    saved,
    trackView,
    toggleLike,
    toggleSave,
    isLoggedIn: !!user,
  };
}
