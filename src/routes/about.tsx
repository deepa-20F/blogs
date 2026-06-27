import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Lumen" },
      { name: "description", content: "Lumen is a small editorial studio publishing slow writing on wellness, design and modern culture." },
      { property: "og:title", content: "About — Lumen" },
      { property: "og:description", content: "A small editorial studio publishing slow writing." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">About</p>
      <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-tight">
        A small studio,<br /><span className="font-serif-display italic text-[#3F6E67]">a quiet ambition.</span>
      </h1>
      <p className="mt-7 text-[17px] leading-relaxed text-muted-foreground">
        Lumen is an independent editorial studio founded on the belief that a
        thoughtful sentence, set with care, can change the shape of an afternoon.
        We publish long-form essays on wellness, modern living and the slow craft
        of attention.
      </p>
      <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
        Our editors come from a mix of disciplines — design, therapy, food,
        engineering — and our writers are paid fairly and edited generously.
        Everything you read here was made by humans.
      </p>
    </div>
  );
}