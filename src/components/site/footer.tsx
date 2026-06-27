import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass-strong noise relative overflow-hidden rounded-[2rem] p-8 sm:p-14 dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#CFE8DF] opacity-50 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#F6EFE4] opacity-70 blur-3xl" />

          <div className="relative grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="gradient-primary grid h-10 w-10 place-items-center rounded-full font-display text-lg text-white shadow-soft">L</span>
                <span className="font-display text-2xl tracking-tight text-foreground">
                  Lumen<span className="text-[#D7B66A]">.</span>
                </span>
              </div>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Stories, essays and quiet ideas for a more considered life.
                Curated weekly by editors who believe slow attention is a kind
                of luxury.
              </p>
            </div>

            <FooterCol
              title="Explore"
              items={[
                { label: "Articles", to: "/articles" },
                { label: "Categories", to: "/categories" },
                { label: "About", to: "/about" },
                { label: "Contact", to: "/contact" },
              ]}
            />
            <FooterCol
              title="Resources"
              items={[
                { label: "Newsletter", to: "/" },
                { label: "Writers", to: "/about" },
                { label: "Press kit", to: "/about" },
                { label: "Privacy", to: "/about" },
              ]}
            />
          </div>

          <div className="relative mt-12 flex flex-col items-start justify-between gap-3 border-t border-black/5 pt-6 text-sm text-muted-foreground dark:border-white/10 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Lumen Editions. Made with quiet attention.</p>
            <p className="font-display italic">"Slow is the new luxury."</p>
          </div>
        </div>
      </div>
      <div className="h-16" />
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-base text-foreground">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              to={i.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}