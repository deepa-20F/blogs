import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lumen" },
      { name: "description", content: "Get in touch with the Lumen editorial team." },
      { property: "og:title", content: "Contact — Lumen" },
      { property: "og:description", content: "Get in touch with the Lumen editorial team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Contact</p>
      <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-tight">
        Say something <span className="font-serif-display italic text-[#3F6E67]">kind.</span>
      </h1>
      <p className="mt-5 text-[16px] text-muted-foreground">
        Pitches, partnerships, gentle corrections — we read everything.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        className="glass-strong mt-10 space-y-4 rounded-[1.75rem] p-6 sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Your name" />
          <Input label="Email" type="email" />
        </div>
        <Input label="Subject" />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Message</span>
          <textarea required rows={6} className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3F6E67]/30" />
        </label>
        <button className="gradient-primary rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]">
          {sent ? "✓ Message sent" : "Send message"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">{label}</span>
      <input required type={type} className="mt-2 w-full rounded-full bg-white/70 px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3F6E67]/30" />
    </label>
  );
}