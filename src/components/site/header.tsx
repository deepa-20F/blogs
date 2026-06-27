import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Moon, Search, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type SearchResult = { slug: string; title: string; category: string; excerpt: string };

const navItems = [
  { to: "/", label: "Home" },
  { to: "/articles", label: "Articles" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const dark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    if (searchOpen) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("user_articles")
        .select("slug, title, category, excerpt")
        .eq("published", true)
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(6);
      setResults((data as SearchResult[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleResultClick(slug: string) {
    closeSearch();
    navigate({ to: "/articles/$slug", params: { slug } });
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-3" : "py-5",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            "flex items-center justify-between rounded-full px-3 py-2 transition-all duration-500 sm:px-5",
            scrolled
              ? "glass-strong dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10"
              : "glass dark:bg-[rgba(30,50,46,0.65)] dark:border-white/10",
          )}
        >
          <Link
            to="/"
            className="group flex items-center gap-2 pl-2 pr-1"
            aria-label="Lumen home"
          >
            <span className="gradient-primary relative grid h-9 w-9 place-items-center rounded-full text-white shadow-soft">
              <span className="font-display text-lg leading-none">L</span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D7B66A] animate-pulse-glow" />
            </span>
            <span className="font-display text-xl tracking-tight text-foreground">
              Lumen<span className="text-[#D7B66A]">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="relative rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
                activeProps={{ className: "text-foreground bg-white/60 dark:bg-white/15" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="relative hidden sm:block">
              <button
                aria-label="Search"
                onClick={searchOpen ? closeSearch : openSearch}
                className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-11 w-80 glass-strong rounded-2xl shadow-luxe overflow-hidden dark:bg-[rgba(28,46,42,0.95)] dark:border-white/10">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3 dark:border-white/10">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search articles…"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                    {searching && (
                      <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[#3F6E67] border-t-transparent" />
                    )}
                  </div>

                  {results.length > 0 ? (
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {results.map((r) => (
                        <li key={r.slug}>
                          <button
                            onClick={() => handleResultClick(r.slug)}
                            className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3F6E67]">{r.category}</span>
                            <span className="text-sm font-medium text-foreground line-clamp-1">{r.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{r.excerpt}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : query.trim() && !searching ? (
                    <p className="px-4 py-5 text-center text-sm text-muted-foreground">No articles found for "{query}"</p>
                  ) : !query.trim() ? (
                    <p className="px-4 py-4 text-center text-xs text-muted-foreground">Type to search articles…</p>
                  ) : null}
                </div>
              )}
            </div>
            <button
              aria-label="Notifications"
              className="hidden h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10 sm:grid"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              aria-label="Toggle dark mode"
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <>
                <Link
                  to="/profile"
                  aria-label="Profile"
                  className="gradient-primary ml-1 grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white shadow-soft"
                  title={profile?.full_name ?? user.email ?? ""}
                >
                  {initials}
                </Link>
                <button
                  aria-label="Sign out"
                  onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                  className="ml-1 hidden h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10 md:grid"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="ml-1 hidden rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground md:inline-block"
                >
                  Login
                </Link>
                <button className="gradient-primary group relative ml-1 overflow-hidden rounded-full px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] sm:px-5">
                  <span className="relative z-10">Subscribe</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}