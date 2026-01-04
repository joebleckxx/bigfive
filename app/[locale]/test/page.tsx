"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";

const RESULT_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";
const PAID_KEY = "bigfive_paid_v1";

// Auto-reset po 1h bez aktywności
const LAST_ACTIVE_KEY = "personality_last_active_v1";
const PROGRESS_TTL_MS = 60 * 60 * 1000; // 1 godzina

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

  // Tap feedback: na ułamek sekundy podświetl klikniętą odpowiedź
  const [tapSelected, setTapSelected] = useState<number | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // ✅ micro-slide przy zmianie pytania (bez fade)
  const [slideIn, setSlideIn] = useState(false);
  useEffect(() => {
    setSlideIn(false);
    const id = requestAnimationFrame(() => setSlideIn(true));
    return () => cancelAnimationFrame(id);
  }, [index]);

  // Wczytaj postęp po wejściu / refreshu + TTL 1h
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
      // każda zmiana odpowiedzi unieważnia wcześniejszy pay/result
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);

      touchLastActive();
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(nextAnswers));
    } catch {
      // ignore
    }
  }

  function commitAnswer(v: number) {
    const next = [...answers];
    next[index] = v;
    setAnswers(next);
    persistAnswers(next);

    const done = next.every((x) => x >= 1 && x <= 5);
    if (done) {
      if (index < total - 1) {
        setIndex(index + 1);
      } else {
        router.push("/pay");
      }
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
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-white/60">{progressText}</div>

          {/* Back: bez underline, bez limitu */}
          <button
            onClick={goBack}
            type="button"
            disabled={index === 0}
            className="text-sm text-white/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            aria-disabled={index === 0 || isAdvancing}
          >
            {t("back")}
          </button>
        </div>

        {/* progress: mniej saturacji, bez kropki */}
        <div className="mb-6 h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-400/65 via-violet-400/65 to-pink-400/65 transition-[width] duration-150"
            style={{
              width: `${progress}%`,
              minWidth: index === 0 ? "24px" : undefined
            }}
          />
        </div>

        {/* ✅ micro-slide wrapper */}
        <div
          className={[
            "transition-transform duration-150 ease-out will-change-transform",
            slideIn ? "translate-y-0" : "translate-y-1"
          ].join(" ")}
        >
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-2xl">
            <h2 className="mb-6 mt-2 text-xl font-semibold leading-snug tracking-tight">
              {q(currentQuestion.id)}
            </h2>

            <div className="space-y-3">
              {SCALE_VALUES.map((v) => {
                const selected = answers[index] === v;
                const tapping = tapSelected === v;

                // ✅ widoczniejsza skala jasności (neutral jaśniej, skrajne ciemniej)
                const baseTone =
                  v === 3
                    ? "border-white/24 bg-white/16"
                    : v === 1 || v === 5
                      ? "border-white/10 bg-white/6"
                      : "border-white/14 bg-white/10";

                // ✅ mocny selected state (żeby po Back było od razu widać)
                const selectedClass =
                  "border-indigo-300/70 bg-white/18 ring-2 ring-indigo-300/45 " +
                  "shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_12px_36px_rgba(0,0,0,0.28)]";

                return (
                  <button
                    key={v}
                    onClick={() => handleAnswer(v)}
                    disabled={isAdvancing}
                    type="button"
                    className={[
                      "w-full rounded-2xl border px-5 py-4 text-left backdrop-blur-xl",
                      "transition-colors duration-150",
                      selected ? selectedClass : baseTone,
                      // hover tylko jako delikatne wzmocnienie
                      !isAdvancing
                        ? "hover:border-white/25 hover:bg-white/15"
                        : "",
                      // highlight po tap (krótki “flash”)
                      tapping ? "bg-white/22 ring-1 ring-white/25" : "",
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