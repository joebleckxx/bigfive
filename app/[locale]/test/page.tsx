"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";

const RESULT_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";
const PAID_KEY = "bigfive_paid_v1";

const LAST_ACTIVE_KEY = "personality_last_active_v1";
const PROGRESS_TTL_MS = 60 * 60 * 1000;

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

function normalizeAnswers(input: unknown, total: number): number[] | null {
  if (!Array.isArray(input) || input.length !== total) return null;
  const arr = input.map((v) =>
    Number.isInteger(v) && v >= 1 && v <= 5 ? v : 0
  );
  return arr;
}

function readLastActive(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function touchLastActive() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function clearProgressStorage() {
  try {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(PAID_KEY);
    localStorage.removeItem(RESULT_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export default function TestPage() {
  const router = useRouter();
  const t = useTranslations("Test");
  const s = useTranslations("Scale");
  const q = useTranslations("Questions");

  const total = QUESTIONS.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(0));

  // tap feedback
  const [tapSelected, setTapSelected] = useState<number | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // menu ⋯
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  // load progress + TTL
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      const hasAnswers = !!raw;

      if (hasAnswers) {
        const lastActiveAt = readLastActive();
        const expired =
          !lastActiveAt || Date.now() - lastActiveAt > PROGRESS_TTL_MS;

        if (expired) {
          clearProgressStorage();
          setAnswers(Array(total).fill(0));
          setIndex(0);
          setTapSelected(null);
          setIsAdvancing(false);
          return;
        }
      }

      if (!raw) return;
      const parsed = JSON.parse(raw);
      const normalized = normalizeAnswers(parsed, total);
      if (!normalized) return;

      setAnswers(normalized);
      const firstUnanswered = normalized.findIndex((v) => v === 0);
      setIndex(firstUnanswered === -1 ? total - 1 : firstUnanswered);
      setTapSelected(null);
      setIsAdvancing(false);
    } catch {
      // ignore
    }
  }, [total]);

  const progressText = t("progress", {
    current: Math.min(index + 1, total),
    total
  });

  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((index + 1) / total) * 100);
  }, [index, total]);

  const currentQuestion = QUESTIONS[index];

  function persistAnswers(nextAnswers: number[]) {
    try {
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);
      touchLastActive();
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(nextAnswers));
    } catch {
      // ignore
    }
  }

  function doReset() {
    clearProgressStorage();
    setAnswers(Array(total).fill(0));
    setIndex(0);
    setTapSelected(null);
    setIsAdvancing(false);
    setMenuOpen(false);
  }

  function goToStart() {
    setMenuOpen(false);
    router.push("/");
  }

  function commitAnswer(v: number) {
    const next = [...answers];
    next[index] = v;
    setAnswers(next);
    persistAnswers(next);

    const done = next.every((x) => x >= 1 && x <= 5);
    if (done) {
      if (index < total - 1) setIndex(index + 1);
      else router.push("/pay");
      return;
    }

    const firstUnanswered = next.findIndex((x) => x === 0);
    setIndex(firstUnanswered === -1 ? total - 1 : firstUnanswered);
  }

  function handleAnswer(v: number) {
    if (isAdvancing) return;

    setIsAdvancing(true);
    setTapSelected(v);

    window.setTimeout(() => {
      commitAnswer(v);
      setTapSelected(null);
      setIsAdvancing(false);
    }, 120);
  }

  function goBack() {
    if (index === 0 || isAdvancing) return;
    touchLastActive();
    setIndex((i) => Math.max(0, i - 1));
  }

  if (!currentQuestion) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-4 py-6 text-white sm:px-6 sm:py-10">
      {/* tło jak wcześniej */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-xl">
        {/* Topbar */}
        <div className="relative z-30 mb-6 flex items-center justify-between">
          <div className="text-sm text-white/60">{progressText}</div>

          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              type="button"
              disabled={index === 0}
              className="text-sm text-white/60 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white/45 disabled:cursor-not-allowed disabled:opacity-40"
              aria-disabled={index === 0 || isAdvancing}
            >
              {t("back")}
            </button>

            {/* Menu ⋯ */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-xl
                  px-2.5 py-1.5 text-sm font-semibold tracking-tight
                  text-white/70 hover:text-white/90
                  border border-white/10 hover:border-white/20
                  bg-transparent hover:bg-white/5
                  transition focus:outline-none"

                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Menu"
              >
                ⋯
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-max
                    rounded-xl border border-white/10
                    bg-[#0B0C14]/90 backdrop-blur-xl
                    shadow-xl overflow-hidden p-1"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={doReset}
                    className="block w-full whitespace-nowrap rounded-lg
                      px-3 py-2 text-sm font-medium tracking-tight
                      text-white/75 hover:text-white hover:bg-white/8"
                    role="menuitem"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={goToStart}
                    className="block w-full whitespace-nowrap rounded-lg
                      px-3 py-2 text-sm font-medium tracking-tight
                      text-white/75 hover:text-white hover:bg-white/8"

                    role="menuitem"
                  >
                    Start
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 h-[6px] w-full rounded-full bg-white/10">
          <div
            className="h-[6px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 transition-[width] duration-150"
            style={{
              width: `${progress}%`,
              minWidth: index === 0 ? "24px" : undefined
            }}
          />
        </div>

        {/* micro-slide USUNIĘTY: brak transition/translate */}
        <div className="relative z-10">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-2xl sm:p-6">
            <h2 className="mb-6 mt-2 text-xl font-semibold leading-snug tracking-tight">
              {q(currentQuestion.id)}
            </h2>

            <div className="space-y-3">
              {SCALE_VALUES.map((v) => {
                const selected = answers[index] === v;
                const tapping = tapSelected === v;

                const baseTone =
                  v === 3
                    ? "border-white/22 bg-white/18"
                    : v === 2 || v === 4
                      ? "border-white/16 bg-white/13"
                      : "border-white/12 bg-white/9";

                // ✅ gradient border only (one element)
                const gradientBorderOneElement =
                  "w-full rounded-2xl border border-transparent px-4 py-3 text-left backdrop-blur-xl sm:px-5 sm:py-4 " +
                  "[background:linear-gradient(#50505F,#50505F)_padding-box,linear-gradient(to_right,#6366F1,#8B5CF6,#EC4899)_border-box]";

                if (tapping || selected) {
                  return (
                    <button
                      key={v}
                      onClick={() => handleAnswer(v)}
                      disabled={isAdvancing}
                      type="button"
                      className={[
                        gradientBorderOneElement,
                        isAdvancing ? "cursor-not-allowed" : "",
                        "focus:outline-none focus-visible:outline-none",
                        "[-webkit-tap-highlight-color:transparent]"
                      ].join(" ")}
                    >
                      <span className="text-sm font-medium text-white/90">
                        {s(String(v))}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={v}
                    onClick={() => handleAnswer(v)}
                    disabled={isAdvancing}
                    type="button"
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left backdrop-blur-xl sm:px-5 sm:py-4",
                      "focus:outline-none focus-visible:outline-none",
                      "[-webkit-tap-highlight-color:transparent]",
                      "active:bg-transparent",
                      // ✅ usunięty transform z transition
                      "transition-[background-color,border-color] duration-150",
                      baseTone,
                      !isAdvancing
                        ? "md:hover:border-white/25 md:hover:bg-white/15"
                        : "",
                      isAdvancing ? "cursor-not-allowed" : ""
                    ].join(" ")}
                  >
                    <span className="text-sm font-medium text-white/90">
                      {s(String(v))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}
