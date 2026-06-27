import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Bookmark, Check, ChevronRight,
  FileText, Loader2, LogOut, Pencil, Plus, Trash2, Upload, User, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Lumen" }] }),
  component: ProfilePage,
});

// ─── helpers ──────────────────────────────────────────────────────
function inputCls(error?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-3 text-[15px] transition-colors",
    "bg-white/70 dark:bg-white/10 text-foreground placeholder:text-muted-foreground/60",
    error ? "border-red-400" : "border-border focus:border-[#3F6E67]/50 focus:ring-[#3F6E67]/20",
    "focus:outline-none focus:ring-2",
  ].join(" ");
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type Tab = "profile" | "articles" | "saved" | "write";

type UserArticle = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  published: boolean;
  cover_url: string | null;
  created_at: string;
};

// ─── Profile Page ─────────────────────────────────────────────────
function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [timedOut, setTimedOut] = useState(false);

  // Hard timeout — if still loading after 3s, stop waiting
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Redirect if not logged in once we know
  useEffect(() => {
    if ((!loading || timedOut) && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, timedOut, user]);

  // Show spinner only while genuinely waiting and not timed out
  if (loading && !timedOut && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "articles", label: "My Articles", icon: <FileText className="h-4 w-4" /> },
    { id: "saved", label: "Saved", icon: <Bookmark className="h-4 w-4" /> },
    { id: "write", label: "Write Article", icon: <Pencil className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
      {/* Header card */}
      <div className="glass-strong relative overflow-hidden rounded-[2rem] p-8 dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#CFE8DF]/60 blur-3xl dark:bg-[#1e3830]/60" />
        <div className="relative flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div className="gradient-primary grid h-20 w-20 shrink-0 place-items-center rounded-full text-2xl font-bold text-white shadow-luxe">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">
              @{profile?.username ?? "member"}
            </p>
            <h1 className="mt-0.5 font-display text-3xl text-foreground">
              {profile?.full_name ?? user.email}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            {profile?.mobile && (
              <p className="text-sm text-muted-foreground">{profile.mobile}</p>
            )}
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-red-300 hover:text-red-500 dark:border-white/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="relative mt-8 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                tab === t.id
                  ? "gradient-primary text-white shadow-soft"
                  : "text-foreground/70 hover:bg-white/60 dark:hover:bg-white/10"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tab === "profile" && <ProfileTab user={user} profile={profile} />}
        {tab === "articles" && <MyArticlesTab userId={user.id} onWrite={() => setTab("write")} />}
        {tab === "saved" && <SavedTab userId={user.id} />}
        {tab === "write" && <WriteArticleTab userId={user.id} onSuccess={() => setTab("articles")} />}
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────
function ProfileTab({ user, profile }: { user: any; profile: any }) {
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [mobile, setMobile] = useState(profile?.mobile ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Sync fields when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setUsername(profile.username ?? "");
      setMobile(profile.mobile ?? "");
    }
  }, [profile?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const { error: e2 } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      username: username.trim() || null,
      mobile: mobile.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (e2) setError(e2.message);
    else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="glass-strong rounded-[2rem] p-8 dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
      <h2 className="font-display text-2xl text-foreground">Edit Profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">Update your personal information.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSave}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls()} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="username" className={inputCls()} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input value={user.email} disabled className={`${inputCls()} opacity-50 cursor-not-allowed`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mobile Number</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Your mobile number" className={inputCls()} />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="gradient-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

// ─── My Articles Tab ──────────────────────────────────────────────
function MyArticlesTab({ userId, onWrite }: { userId: string; onWrite: () => void }) {
  const [items, setItems] = useState<UserArticle[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("user_articles")
      .select("id,title,excerpt,category,slug,published,cover_url,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems((data as UserArticle[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    await supabase.from("user_articles").delete().eq("id", id);
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  async function togglePublish(id: string, current: boolean) {
    await supabase.from("user_articles").update({ published: !current }).eq("id", id);
    setItems((prev) => prev.map((a) => a.id === id ? { ...a, published: !current } : a));
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">My Articles ({items.length})</h2>
        <button onClick={onWrite} className="gradient-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft">
          <Plus className="h-4 w-4" /> Write new
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass-strong rounded-[2rem] p-16 text-center dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-display text-xl text-foreground">No articles yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Share your first story with the world.</p>
          <button onClick={onWrite} className="gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft">
            <Pencil className="h-4 w-4" /> Write your first article
          </button>
        </div>
      ) : (
        items.map((a) => (
          <div key={a.id} className="glass-strong flex items-start gap-4 rounded-2xl p-5 dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
            {a.cover_url && (
              <img src={a.cover_url} alt={a.title} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-[#3F6E67]/10 px-3 py-0.5 text-[11px] font-semibold text-[#3F6E67]">{a.category}</span>
                <span className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${a.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                  {a.published ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg text-foreground line-clamp-1">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button onClick={() => togglePublish(a.id, a.published)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground dark:border-white/10">
                {a.published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => handleDelete(a.id)} className="flex items-center justify-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Saved Tab ────────────────────────────────────────────────────
type SavedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_url: string | null;
  saved_at: string;
};

function SavedTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("saved_articles")
      .select("slug, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return; }

        const slugs = data.map((r: any) => r.slug);
        const savedAtMap: Record<string, string> = {};
        data.forEach((r: any) => { savedAtMap[r.slug] = r.saved_at; });

        // Fetch article details from user_articles
        const { data: arts } = await supabase
          .from("user_articles")
          .select("slug, title, excerpt, category, cover_url")
          .in("slug", slugs);

        const result: SavedArticle[] = (arts ?? []).map((a: any) => ({
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          cover_url: a.cover_url,
          saved_at: savedAtMap[a.slug] ?? "",
        }));

        // Sort by saved_at order
        result.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
        setItems(result);
        setLoading(false);
      });
  }, [userId]);

  async function unsave(slug: string) {
    await supabase.from("saved_articles").delete().eq("user_id", userId).eq("slug", slug);
    setItems((prev) => prev.filter((a) => a.slug !== slug));
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-foreground">Saved Articles ({items.length})</h2>
      {items.length === 0 ? (
        <div className="glass-strong rounded-[2rem] p-16 text-center dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-display text-xl text-foreground">Nothing saved yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Bookmark articles to read them later.</p>
          <Link to="/articles" className="gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft">
            Browse articles <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        items.map((a) => (
          <div key={a.slug} className="glass-strong flex items-center gap-4 rounded-2xl p-4 dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
            {a.cover_url ? (
              <img src={a.cover_url} alt={a.title} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-[#3F6E67]/10 text-2xl">
                📖
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3F6E67]">{a.category}</p>
              <Link
                to="/articles/$slug"
                params={{ slug: a.slug }}
                className="mt-1 block font-display text-base text-foreground hover:text-[#3F6E67] line-clamp-1"
              >
                {a.title}
              </Link>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{a.excerpt}</p>
            </div>
            <button
              onClick={() => unsave(a.slug)}
              className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:text-red-500"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Write Article Tab ────────────────────────────────────────────
function WriteArticleTab({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(categories[0].name);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      setError("Title, excerpt and content are required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      let cover_url: string | null = null;

      // Upload cover image if provided
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("article-covers")
          .upload(path, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("article-covers")
          .getPublicUrl(path);
        cover_url = urlData.publicUrl;
      }

      const slug = slugify(title) + "-" + Date.now().toString(36);

      const { error: insertError } = await supabase.from("user_articles").insert({
        user_id: userId,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        cover_url,
        slug,
        published,
      });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish article.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-strong rounded-[2rem] p-8 dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
      <h2 className="font-display text-2xl text-foreground">Write an Article</h2>
      <p className="mt-1 text-sm text-muted-foreground">Share your ideas with the Lumen community.</p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Cover image */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cover Image</label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed transition-colors hover:border-[#3F6E67]/50 ${
              coverPreview ? "border-transparent p-0" : "border-border p-10"
            }`}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover preview" className="aspect-[16/7] w-full object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#3F6E67]/10 text-[#3F6E67]">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload cover image</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title *</label>
          <input
            type="text"
            required
            placeholder="Your article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls()}
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Excerpt *</label>
          <textarea
            required
            rows={2}
            placeholder="A short summary of your article (shown in cards)"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className={`${inputCls()} resize-none`}
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls()}
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Content *</label>
          <textarea
            required
            rows={12}
            placeholder="Write your article here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputCls()} resize-y font-sans text-sm leading-relaxed`}
          />
        </div>

        {/* Publish toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-white/40 px-5 py-4 dark:bg-white/5 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-foreground">Publish immediately</p>
            <p className="text-xs text-muted-foreground">Turn off to save as draft</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={published}
            onClick={() => setPublished((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#3F6E67]/50 focus:ring-offset-2 ${published ? "bg-[#3F6E67]" : "bg-gray-300 dark:bg-white/20"}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${published ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="gradient-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {published ? "Publish article" : "Save as draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
