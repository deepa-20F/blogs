import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
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

  // Close search on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    if (searchOpen) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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
    setMenuOpen(false);
    navigate({ to: "/articles/$slug", params: { slug } });
  }

  function handleNavClick() {
    setMenuOpen(false);
    closeSearch();
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <>
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
            {/* Logo */}
            <Link
              to="/"
              onClick={handleNavClick}
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

            {/* Desktop nav */}
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

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Desktop search */}
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
                    ) : (
                      <p className="px-4 py-4 text-center text-xs text-muted-foreground">Type to search articles…</p>
                    )}
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              <button
                aria-label="Toggle dark mode"
                onClick={toggle}
                className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Auth */}
              {user ? (
                <Link
                  to="/profile"
                  aria-label="Profile"
                  onClick={handleNavClick}
                  className="gradient-primary ml-1 grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white shadow-soft"
                  title={profile?.full_name ?? user.email ?? ""}
                >
                  {initials}
                </Link>
              ) : (
                <Link
                  to="/auth"
                  onClick={handleNavClick}
                  className="gradient-primary ml-1 overflow-hidden rounded-full px-4 py-2 text-sm font-semibold text-white shadow-soft hidden sm:block"
                >
                  Sign in
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((v) => !v)}
                className="ml-1 grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10 md:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="absolute inset-x-4 top-24 rounded-[2rem] glass-strong shadow-luxe dark:bg-[rgba(28,46,42,0.97)] dark:border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile search */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-4 dark:border-white/10">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={mobileInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              {query ? (
                <button onClick={() => setQuery("")} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              ) : searching ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#3F6E67] border-t-transparent" />
              ) : null}
            </div>

            {/* Search results */}
            {query.trim() && (
              <div className="border-b border-border dark:border-white/10">
                {results.length > 0 ? (
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {results.map((r) => (
                      <li key={r.slug}>
                        <button
                          onClick={() => handleResultClick(r.slug)}
                          className="flex w-full flex-col gap-0.5 px-5 py-3 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3F6E67]">{r.category}</span>
                          <span className="text-sm font-medium text-foreground line-clamp-1">{r.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : !searching ? (
                  <p className="px-5 py-3 text-sm text-muted-foreground">No results for "{query}"</p>
                ) : null}
              </div>
            )}

            {/* Nav links */}
            <nav className="py-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className="flex items-center px-5 py-3.5 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
                  activeProps={{ className: "text-[#3F6E67] font-semibold" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile auth */}
            <div className="border-t border-border px-5 py-4 dark:border-white/10">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="gradient-primary grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-foreground">{profile?.full_name ?? user.email}</p>
                      <p className="text-xs text-muted-foreground">@{profile?.username ?? "member"}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => { await signOut(); setMenuOpen(false); navigate({ to: "/" }); }}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-red-500 dark:border-white/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/auth"
                    onClick={handleNavClick}
                    className="flex-1 rounded-full border border-border py-2.5 text-center text-sm font-semibold text-foreground dark:border-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/auth"
                    onClick={handleNavClick}
                    className="gradient-primary flex-1 rounded-full py-2.5 text-center text-sm font-semibold text-white shadow-soft"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
