"use client";

import { useRouter } from "next/navigation";

const PAID_KEY = "bigfive_paid_v1";

export default function PayPage() {
  const router = useRouter();

  function handleUnlock() {
    localStorage.setItem(PAID_KEY, "true");
    router.push("/result");
  }

  function handleBack() {
    router.push("/test");
  }

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
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              Personality test
            </div>
            <div className="text-xs text-white/55">
              soft • premium • mobile
            </div>
          </div>
        </div>

        {/* Hero */}
        <h1 className="mt-10 text-[2.4rem] font-semibold leading-[1.1] tracking-tight">
          Twój{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            pełny wynik
          </span>{" "}
          jest gotowy
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          Otrzymasz kompletny profil osobowości oparty o Big Five: procentowy
          wynik każdej cechy i krótką interpretację.
        </p>

        {/* Value pills */}
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            ✔️ 5 cech (OCEAN)
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            📊 wyniki procentowe
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            ✍️ krótka interpretacja
          </span>
        </div>

        {/* Soft info cards */}
        <div className="mt-8 space-y-3">
          <InfoCard
            title="Co dokładnie odblokowuję?"
            text="Pełny raport pięciu cech wraz z krótkimi wskazówkami, jak wykorzystać mocne strony."
          />
          <InfoCard
            title="Czy to jednorazowe?"
            text="Tak. Płacisz raz i od razu masz dostęp do wyniku."
          />
          <InfoCard
            title="To tylko symulacja"
            text="Przycisk uruchamia wersję testową — bez prawdziwej płatności."
          />
        </div>

        {/* Main CTA */}
        <div className="mt-8">
          <button
            onClick={handleUnlock}
            className="relative inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white
              bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
              shadow-[0_20px_60px_rgba(99,102,241,0.35)]
              transition active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
            type="button"
          >
            Odblokuj wynik – 1$ (wersja testowa)
          </button>

          <button
            onClick={handleBack}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-base font-semibold text-white/85
              backdrop-blur-md transition hover:border-white/40"
            type="button"
          >
            Wróć do testu
          </button>

          <p className="mt-3 text-center text-xs text-white/55">
            Jednorazowa płatność. Bez subskrypcji.
          </p>
        </div>

        {/* Spacer */}
        <div className="h-6" />

        <p className="mt-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Test osobowości
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
