import { Link } from "@tanstack/react-router";
import { Bookmark, Eye, Heart, Share2 } from "lucide-react";
import type { Article } from "@/lib/mock-data";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to="/articles/$slug"
      params={{ slug: article.slug }}
      className="group hover-lift glass relative flex flex-col overflow-hidden rounded-[1.75rem] p-3 transition-all"
    >
      <div className="relative overflow-hidden rounded-[1.4rem]">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-[4/3] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-gradient-to-br from-[#CFE8DF] to-[#e8f5f0] dark:from-[#1e3830] dark:to-[#162e28] flex items-center justify-center">
            <span className="text-5xl opacity-40">✍️</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {article.category}
        </span>
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-foreground/60 backdrop-blur">
          <Bookmark className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-5">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>{article.date}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
          <span>{article.readTime}</span>
        </div>
        <h3 className="font-display text-[1.35rem] leading-snug text-foreground transition-colors group-hover:text-[#3F6E67]">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-[14.5px] leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2.5">
            <span className="gradient-primary grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white shadow-soft">
              {article.author.initials}
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-foreground">{article.author.name}</p>
              <p className="text-[11px] text-muted-foreground">{article.author.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />{article.views}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />{article.likes}
            </span>
            <Share2 className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
