export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base gradient — light & dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F6FAF8] via-[#EEF5F2] to-[#F6EFE4] dark:from-[#0d1f1c] dark:via-[#111827] dark:to-[#1a1209]" />

      {/* Aurora mesh */}
      <div
        className="animate-aurora absolute -inset-[20%] opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 15% 20%, rgba(207,232,223,0.85) 0%, transparent 60%), radial-gradient(50% 50% at 85% 15%, rgba(234,231,248,0.7) 0%, transparent 60%), radial-gradient(55% 55% at 70% 85%, rgba(246,239,228,0.9) 0%, transparent 60%), radial-gradient(40% 40% at 25% 80%, rgba(215,182,106,0.25) 0%, transparent 60%)",
        }}
      />

      {/* Floating blobs */}
      <div className="animate-blob absolute -top-32 -left-32 h-[42rem] w-[42rem] rounded-full bg-[#CFE8DF] opacity-50 blur-3xl" />
      <div
        className="animate-blob absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-[#EAE7F8] opacity-50 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="animate-blob absolute bottom-0 left-1/4 h-[30rem] w-[30rem] rounded-full bg-[#F6EFE4] opacity-60 blur-3xl"
        style={{ animationDelay: "-14s" }}
      />
      <div
        className="animate-blob absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "#D7B66A", animationDelay: "-3s" }}
      />

      {/* Soft light rays */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}