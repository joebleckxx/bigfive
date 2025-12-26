// app/m/page.tsx
import { Logo } from "@/app/components/ui/logo";
import Link from "next/link";

export default function MobileLandingAppleSoft() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] text-white px-5 py-10">
      {/* Soft gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-lg">
            <Logo className="text-indigo-200" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Personality test</div>
            <div className="text-xs text-white/55">soft • premium • mobile</div>
          </div>
        </div>

        {/* Hero */}
        <h1 className="mt-10 text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
          Discover your{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            personality profile
          </span>
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          A calm, short test based on response patterns. No judgment. No
          pressure. A result that actually makes sense.
        </p>

        {/* Trust pills */}
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            ⏱ 5–7 minutes
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            🔒 anonymous
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            ✨ pleasant UX
          </span>
        </div>

        {/* Main CTA */}
        <div className="mt-8">
          <Link
            href="/test"
            className="relative inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white
              bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
              shadow-[0_20px_60px_rgba(99,102,241,0.35)]
              transition active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
          >
            Start the test →
          </Link>

          <p className="mt-3 text-center text-xs text-white/55">
            You can pause anytime
          </p>
        </div>

        {/* Soft info cards */}
        <div className="mt-10 space-y-3">
          <InfoCard
            title="What will I get?"
            text="A description of your thinking style, strengths, and gentle growth tips."
          />
          <InfoCard
            title="Is it anonymous?"
            text="Yes. No account or personal data required."
          />
          <InfoCard
            title="How many questions?"
            text="A handful of short questions — answer intuitively."
          />
        </div>

        {/* Floating bottom CTA (Apple-like) */}
        <div className="fixed inset-x-0 bottom-0 z-50 px-5 pb-5">
          <div className="mx-auto max-w-md rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.4)] p-3">
            <Link
              href="/start"
              className="inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-white
                bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
                shadow-[0_14px_40px_rgba(99,102,241,0.35)]
                transition active:scale-[0.98]"
            >
              Start personality test →
            </Link>
            <div className="mt-2 text-center text-[11px] text-white/50">
              Calm • elegant • no pressure
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-28" />

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Personality test
        </p>
      </div>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl shadow-lg">
      <div className="text-sm font-semibold text-white/85">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
    </div>
  );
}
