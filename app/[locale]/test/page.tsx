"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import {
  QUESTIONS,
  makeQuestionOrder,
  questionsFromOrder
} from "@/lib/personality";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import LegalFooter from "@/app/components/ui/legal-footer";
import TMJBackground from "@/app/components/ui/background";

const RESULT_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";
const QUESTION_ORDER_KEY = "personality_question_order_v1";

// ✅ NEW + ✅ legacy fallback
const PAID_KEY = "personality_paid_v1";

const LAST_ACTIVE_KEY = "personality_last_active_v1";
const PROGRESS_TTL_MS = 30 * 60 * 1000;

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
    localStorage.removeItem(QUESTION_ORDER_KEY);

    // ✅ czyścimy oba (nowy + legacy)
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
  const th = useTranslations("Home");
  const s = useTranslations("Scale");
  const q = useTranslations("Questions");

  const total = QUESTIONS.length;

  // ✅ LOSOWA, ZAMROŻONA KOLEJNOŚĆ PYTAŃ (bez hydration mismatch)
  const [questionOrder, setQuestionOrder] = useState<string[]>(
    () => QUESTIONS.map((qq) => qq.id)
  );
  const [orderReady, setOrderReady] = useState(false);

  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(QUESTION_ORDER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === total) {
            if (!cancelled) {
              setQuestionOrder(parsed);
              setOrderReady(true);
            }
            return;
          }
        }

        const seed = crypto.randomUUID();
        const order = makeQuestionOrder(seed, 2);
        localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
        if (!cancelled) {
          setQuestionOrder(order);
          setOrderReady(true);
        }
      } catch {
        if (!cancelled) setOrderReady(true);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [total]);

  const orderedQuestions = useMemo(
    () => questionsFromOrder(questionOrder),
    [questionOrder]
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(0));

  // tap feedback
  const [tapSelected, setTapSelected] = useState<number | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // load progress + TTL
  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(ANSWERS_KEY);
        const hasAnswers = !!raw;

        if (hasAnswers) {
          const lastActiveAt = readLastActive();
          const expired =
            !lastActiveAt || Date.now() - lastActiveAt > PROGRESS_TTL_MS;

          if (expired) {
            clearProgressStorage();
            if (!cancelled) {
              setAnswers(Array(total).fill(0));
              setIndex(0);
              setTapSelected(null);
              setIsAdvancing(false);
              setShowIntro(true);
            }

            try {
              const seed = crypto.randomUUID();
              const order = makeQuestionOrder(seed, 2);
              localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
              if (!cancelled) setQuestionOrder(order);
            } catch {
              // ignore
            }

            return;
          }
        }

        try {
          const rawOrder = localStorage.getItem(QUESTION_ORDER_KEY);
          if (rawOrder) {
            const parsed = JSON.parse(rawOrder);
            if (Array.isArray(parsed) && parsed.length === total) {
              if (!cancelled) setQuestionOrder(parsed);
            } else {
              const seed = crypto.randomUUID();
              const order = makeQuestionOrder(seed, 2);
              localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
              if (!cancelled) setQuestionOrder(order);
            }
          } else {
            const seed = crypto.randomUUID();
            const order = makeQuestionOrder(seed, 2);
            localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
            if (!cancelled) setQuestionOrder(order);
          }
        } catch {
          // ignore
        }

        if (!raw) {
          if (!cancelled) setShowIntro(true);
          return;
        }

        const parsed = JSON.parse(raw);
        const normalized = normalizeAnswers(parsed, total);
        if (!normalized) {
          if (!cancelled) setShowIntro(true);
          return;
        }

        if (!cancelled) {
          setAnswers(normalized);
          const firstUnanswered = normalized.findIndex((v) => v === 0);
          const hasStarted = normalized.some((v) => v >= 1 && v <= 5);

          setIndex(firstUnanswered === -1 ? total - 1 : firstUnanswered);
          setTapSelected(null);
          setIsAdvancing(false);
          setShowIntro(!hasStarted);
        }
      } catch {
        // ignore
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [total]);

  const answeredCount = useMemo(
    () => answers.filter((value) => value >= 1 && value <= 5).length,
    [answers]
  );

  const progressText = t("progress", {
    current: Math.min(index + 1, total),
    total
  });

  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((answeredCount / total) * 100);
  }, [answeredCount, total]);

  const currentQuestion = orderedQuestions[index];

  function persistAnswers(nextAnswers: number[]) {
    try {
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);

      touchLastActive();
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(nextAnswers));

      if (!localStorage.getItem(QUESTION_ORDER_KEY)) {
        localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(questionOrder));
      }
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
    commitAnswer(v);
    requestAnimationFrame(() => {
      setTapSelected(null);
      setIsAdvancing(false);
    });
  }

  function goBack() {
    if (index === 0 || isAdvancing) return;
    touchLastActive();
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (isAdvancing) return;
    const currentValue = answers[index];
    if (!(currentValue >= 1 && currentValue <= 5)) return;

    touchLastActive();
    if (index < total - 1) {
      setIndex((i) => Math.min(total - 1, i + 1));
      return;
    }
    router.push("/pay");
  }

  function startTest() {
    touchLastActive();
    setShowIntro(false);
  }

  if (!currentQuestion) return null;
  const currentAnswered = answers[index] >= 1 && answers[index] <= 5;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02030A] px-5 py-10 text-white sm:px-5">
      <TMJBackground />

      <div className="relative mx-auto max-w-xl">
        {/* Topbar */}
        <div className="relative z-30 mb-6 flex items-center justify-between gap-3">
          <div className="leading-tight">
            <Link
              href="/"
              className="bg-[linear-gradient(90deg,#57D6FF_0%,#7CB6FF_42%,#C08CFF_72%,#F08CFF_100%)] bg-clip-text text-sm font-bold tracking-tight text-transparent"
            >
              {th("brand.title")}
            </Link>
          </div>

          <LanguageSwitcher />
        </div>

        {!showIntro && (
          <div className="mb-10">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="text-[0.98rem] font-medium tracking-[0.02em] text-white/92">
                {progressText}
              </div>
              <div className="text-[0.82rem] font-medium uppercase tracking-[0.18em] text-[#67D7FF]">
                {progress}% {t("complete")}
              </div>
            </div>
            <div className="relative h-[8px] w-full overflow-hidden rounded-full bg-[#1A2544] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div
                className="absolute left-0 top-0 h-[8px] rounded-full bg-[linear-gradient(90deg,#52D4FF_0%,#79C1FF_32%,#B79FFF_69%,#F087EE_100%)] shadow-[0_0_18px_rgba(82,212,255,0.28)] transition-[width] duration-150"
                style={{
                  width: `${progress}%`,
                  minWidth: index === 0 ? "24px" : undefined
                }}
              />
            </div>
          </div>
        )}

        <div className="relative z-10 mt-8">
          {showIntro ? (
            <div
              className="rounded-[2.35rem] border border-white/[0.025] bg-[#071126]/95 px-5 pt-6 pb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_30px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:px-6 sm:pt-7 sm:pb-7"
            >
              <div className="mx-auto max-w-md">
                <div className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#67D7FF]">
                  {t("intro.questions")}
                </div>

                <h1 className="text-[1.7rem] font-semibold leading-[1.1] tracking-tight sm:text-[2rem]">
                  {t("intro.headline")}
                </h1>

                <p className="mt-4 text-[0.98rem] leading-relaxed text-white/72">
                  {t("intro.subheadline")}
                </p>

                <div className="mt-6 space-y-3 text-sm text-white/82">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    {t("intro.duration")}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    {t("intro.privacy")}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    {t("intro.patterns")}
                  </div>
                </div>

                <button
                  onClick={startTest}
                  type="button"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-3xl bg-[linear-gradient(90deg,#52D4FF_0%,#79C1FF_32%,#B79FFF_69%,#F087EE_100%)] px-5 py-4 text-sm font-semibold text-[#08111F] shadow-[0_10px_30px_rgba(82,212,255,0.18)] transition hover:scale-[1.01] cursor-pointer"
                >
                  {t("intro.cta")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[2.35rem] border border-white/[0.025] bg-[#071126]/95 px-5 pt-4 pb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_30px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:px-6 sm:pt-6 sm:pb-7">
                <h2 className="mb-6 mt-2 text-xl font-semibold leading-snug tracking-tight">
                  {orderReady ? q(currentQuestion.id) : "\u00A0"}
                </h2>

                <div className="space-y-3">
                  {SCALE_VALUES.map((v) => {
                    const selected = answers[index] === v;
                    const tapping = tapSelected === v;

                    const baseTone =
                      v === 3
                        ? "border-white/10 bg-white/8"
                        : v === 2 || v === 4
                          ? "border-white/10 bg-white/8"
                          : "border-white/10 bg-white/8";

                    return (
                      <button
                        key={v}
                        onPointerDown={() => {
                          if (!isAdvancing) setTapSelected(v);
                        }}
                        onPointerCancel={() => {
                          if (tapSelected === v) setTapSelected(null);
                        }}
                        onClick={() => handleAnswer(v)}
                        aria-disabled={isAdvancing}
                        type="button"
                        className={[
                          "w-full rounded-3xl border px-4 py-3 text-left sm:px-5 sm:py-4",
                          "appearance-none cursor-pointer",
                          "focus:outline-none focus-visible:outline-none",
                          "[-webkit-tap-highlight-color:transparent]",
                          selected ? "border-white/70 bg-white/8" : baseTone,
                          tapping ? "border-white/70 bg-white/8" : "",
                          isAdvancing ? "pointer-events-none cursor-not-allowed" : ""
                        ].join(" ")}
                        style={
                          selected || tapping
                            ? { borderColor: "#67D7FF" }
                            : undefined
                        }
                      >
                        <span className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-white/90">
                            {s(String(v))}
                          </span>
                          <span
                            className={[
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                              selected || tapping
                                ? "border-[#67D7FF] bg-[#67D7FF]"
                                : "border-white/10 bg-transparent"
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {(selected || tapping) && (
                              <Image
                                src="/icons/test/answer-check.svg"
                                alt=""
                                aria-hidden="true"
                                width={12}
                                height={12}
                                className="h-3 w-3"
                              />
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 px-1">
                <button
                  onClick={goBack}
                  type="button"
                  disabled={index === 0}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-disabled={index === 0 || isAdvancing}
                >
                  <Image
                    src="/icons/test/nav-back.svg"
                    alt=""
                    aria-hidden="true"
                    width={13}
                    height={13}
                    className="h-[0.8125rem] w-[0.8125rem]"
                  />
                  <span>{t("back")}</span>
                </button>

                <button
                  onClick={goNext}
                  type="button"
                  disabled={!currentAnswered || isAdvancing}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-disabled={!currentAnswered || isAdvancing}
                >
                  <span>{t("next")}</span>
                  <Image
                    src="/icons/test/nav-next.svg"
                    alt=""
                    aria-hidden="true"
                    width={13}
                    height={13}
                    className="h-[0.8125rem] w-[0.8125rem]"
                  />
                </button>
              </div>

              <div className="hidden mt-6 mb-6 text-xs italic text-white/50">
                {t("tip")}
              </div>
            </>
          )}
        </div>

        <LegalFooter />
      </div>
    </main>
  );
}
