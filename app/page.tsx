import { Logo } from "@/app/components/ui/logo";
import Link from "next/link";

const IconClock = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconLock = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="8" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const IconSpark = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
  </svg>
);

export default function MobileLandingAppleSoft() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] text-white px-5 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-lg">
            <Logo className="text-indigo-200" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Personality test</div>
            <div className="text-xs text-white/55">soft • premium • mobile</div>
          </div>
        </div>

        <h1 className="mt-10 text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
          Discover your{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            personality profile
          </span>
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          A calm, short test based on response patterns. No judgment. No pressure. A result that actually makes sense.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <IconClock />
              5-7 minutes
            </span>
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <IconLock />
              Anonymous
            </span>
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <IconSpark />
              pleasant UX
            </span>
          </span>
        </div>
        <p className="mt-3 text-sm text-white/55">
          Takes ~5–7 minutes. No account.
        </p>

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

        <div className="mt-10 space-y-3">
          <InfoCard
            title="What will I get?"
            text="A clear profile, strengths, blind spots, and practical tips."
          />
          <InfoCard
            title="Is it anonymous?"
            text="Yes. No account or personal data required."
          />
          <InfoCard
            title="How many questions?"
            text="A short set of questions — answer intuitively."
          />
        </div>

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
