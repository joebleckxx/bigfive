"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import {
  QUESTIONS,
  makeQuestionOrder,
  questionsFromOrder
} from "@/lib/personality";
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
  const s = useTranslations("Scale");
  const q = useTranslations("Questions");

  const total = QUESTIONS.length;

  // ✅ LOSOWA, ZAMROŻONA KOLEJNOŚĆ PYTAŃ (bez hydration mismatch)
  const [questionOrder, setQuestionOrder] = useState<string[]>(
    () => QUESTIONS.map((qq) => qq.id) // deterministycznie na SSR i na 1. render klienta
  );
  const [orderReady, setOrderReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUESTION_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === total) {
          setQuestionOrder(parsed);
          setOrderReady(true);
          return;
        }
      }

      const seed = crypto.randomUUID();
      const order = makeQuestionOrder(seed, 2);
      localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
      setQuestionOrder(order);
      setOrderReady(true);
    } catch {
      setOrderReady(true);
    }
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

          // ✅ po TTL resetujemy też kolejność
          try {
            const seed = crypto.randomUUID();
            const order = makeQuestionOrder(seed, 2);
            localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
            setQuestionOrder(order);
          } catch {
            // ignore
          }

          return;
        }
      }

      // ✅ upewnij się, że mamy kolejność (jeśli ktoś ma stare storage bez order)
      try {
        const rawOrder = localStorage.getItem(QUESTION_ORDER_KEY);
        if (rawOrder) {
          const parsed = JSON.parse(rawOrder);
          if (Array.isArray(parsed) && parsed.length === total) {
            setQuestionOrder(parsed);
          } else {
            const seed = crypto.randomUUID();
            const order = makeQuestionOrder(seed, 2);
            localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
            setQuestionOrder(order);
          }
        } else {
          const seed = crypto.randomUUID();
          const order = makeQuestionOrder(seed, 2);
          localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
          setQuestionOrder(order);
        }
      } catch {
        // ignore
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

  // ✅ ZAMIANA: pytanie wg wylosowanej kolejności
  const currentQuestion = orderedQuestions[index];

  function persistAnswers(nextAnswers: number[]) {
    try {
      // ✅ reset paid + result po każdej zmianie odpowiedzi (czyści oba klucze)
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);

      touchLastActive();
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(nextAnswers));

      // ✅ kolejność już jest zapisana; tu tylko dbamy, żeby nie znikła przypadkiem
      if (!localStorage.getItem(QUESTION_ORDER_KEY)) {
        localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(questionOrder));
      }
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

    // ✅ reset generuje nową kolejność
    try {
      const seed = crypto.randomUUID();
      const order = makeQuestionOrder(seed, 2);
      localStorage.setItem(QUESTION_ORDER_KEY, JSON.stringify(order));
      setQuestionOrder(order);
    } catch {
      // ignore
    }
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

  if (!currentQuestion) return null;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#02030A] px-6 sm:px-5 py-10 text-white"
    >
      <TMJBackground />

      <div className="relative mx-auto max-w-xl">
        {/* Topbar */}
        <div className="relative z-30 mb-6 flex items-center justify-between">
          <div className="text-sm text-white/70">{progressText}</div>

          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              type="button"
              disabled={index === 0}
              className="text-sm text-white/60 underline underline-offset-4 decoration-white/20 hover:text-white/90 hover:decoration-white/45 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
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
                  transition focus:outline-none
                  cursor-pointer"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("menu")}
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
                      text-white/75 hover:text-white/90 hover:bg-white/8
                      cursor-pointer"
                    role="menuitem"
                  >
                    {t("reset")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="h-[6px] w-full rounded-full bg-white/10">
            <div
              className="h-[6px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 transition-[width] duration-150"
              style={{
                width: `${progress}%`,
                minWidth: index === 0 ? "24px" : undefined
              }}
            />
          </div>
        </div>

        {/* Test */}
        <div className="relative z-10 mt-8">
          <div className="rounded-3xl border border-white/10 bg-white/8
                          px-4 pt-4 pb-5
                          shadow-xl backdrop-blur-2xl
                          sm:px-6 sm:pt-6 sm:pb-7">
            <h2 className="mb-6 mt-2 text-xl font-semibold leading-snug tracking-tight">
              {orderReady ? q(currentQuestion.id) : "\u00A0"}
            </h2>
            <div className="space-y-3">
              {SCALE_VALUES.map((v) => {
                const selected = answers[index] === v;
                const tapping = tapSelected === v;

                // zostawiamy Twoje delikatne tło (to samo co było), ale bez efektów
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
                      // ✅ TYLKO to ma się zmieniać wizualnie:
                      selected ? "border-white/70 bg-white/8" : baseTone,
                      tapping ? "border-white/70 bg-white/8" : "",
                      isAdvancing ? "pointer-events-none cursor-not-allowed" : ""
                    ].join(" ")}
                  >
                    <span className="text-sm font-medium text-white/90">{s(String(v))}</span>
                  </button>
                );
              })}
            </div>
          </div>
            {/* Joe microcopy */}
          <div className="hidden mt-6 mb-6 text-xs text-white/50 italic">
            {t("tip")}           
          </div>
        </div>
        <LegalFooter />
      </div>
    </main>
  );
}
