"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";

type AnswersMap = Record<number, number>;

const STORAGE_KEY = "bigfive_answers_v1";

const OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Zdecydowanie nie" },
  { value: 2, label: "Raczej nie" },
  { value: 3, label: "Trudno powiedzieć" },
  { value: 4, label: "Raczej tak" },
  { value: 5, label: "Zdecydowanie tak" },
];

function loadAnswers(): AnswersMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AnswersMap;
  } catch {
    return {};
  }
}

function saveAnswers(answers: AnswersMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

export default function TestPage() {
  const router = useRouter();

  const initial = useMemo(() => loadAnswers(), []);
  const [answers, setAnswers] = useState<AnswersMap>(initial);

  const answeredCount = Object.keys(answers).length;
  const currentIndex = Math.min(answeredCount, QUESTIONS.length - 1);
  const currentQuestion = QUESTIONS[currentIndex];

  const progressText = `Pytanie ${currentIndex + 1} z ${QUESTIONS.length}`;

  function handleAnswer(value: number) {
    const next = { ...answers, [currentQuestion.id]: value };
    setAnswers(next);
    saveAnswers(next);

    if (currentIndex >= QUESTIONS.length - 1) {
      router.push("/pay");
    }
  }

  function resetTest() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-6 py-10 text-white">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-white/60">{progressText}</div>
          <button
            onClick={resetTest}
            className="text-sm text-white/60 hover:text-white underline underline-offset-4"
            type="button"
          >
            Reset
          </button>
        </div>

        {/* Question card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-xl p-6">
          <h2 className="mb-6 text-xl font-semibold leading-snug tracking-tight">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className={[
                  "w-full text-left px-5 py-4 rounded-2xl transition",
                  "border backdrop-blur-xl",
                  "border-white/15 bg-white/10",
                  "hover:bg-white/15 hover:border-indigo-400/40",
                  "active:scale-[0.99]",
                ].join(" ")}
                type="button"
              >
                <span className="text-sm font-medium text-white/90">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-white/55">
            Wskazówka: odpowiadaj intuicyjnie — nie ma złych odpowiedzi.
          </p>
        </div>
      </div>
    </main>
  );
}
