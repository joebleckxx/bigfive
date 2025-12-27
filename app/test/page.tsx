"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/personality";

const RESULT_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";
const PAID_KEY = "bigfive_paid_v1";

const SCALE = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
] as const;

export default function TestPage() {
  const router = useRouter();

  const total = QUESTIONS.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(total).fill(0));

  useEffect(() => {
    try {
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);
      localStorage.removeItem(ANSWERS_KEY);
    } catch {
      // ignore write errors
    }
  }, []);

  const currentQuestion = QUESTIONS[index];
  const progressText = `Question ${index + 1} of ${total}`;

  const progress = useMemo(
    () => Math.round(((index + 1) / total) * 100),
    [index, total]
  );

  function finish(finalAnswers: number[]) {
    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(finalAnswers));
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);
    } catch {
      // ignore write errors
    }

    router.push("/pay");
  }

  function handleAnswer(v: number) {
    const nextAnswers = [...answers];
    nextAnswers[index] = v;
    setAnswers(nextAnswers);

    if (index >= total - 1) {
      finish(nextAnswers);
      return;
    }

    setIndex(index + 1);
  }

  function resetTest() {
    try {
      localStorage.removeItem(ANSWERS_KEY);
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);
    } catch {
      // ignore write errors
    }
    setAnswers(Array(total).fill(0));
    setIndex(0);
  }

  function goBack() {
    if (index === 0) return;
    const prevIndex = index - 1;
    const nextAnswers = [...answers];
    nextAnswers[prevIndex] = 0;
    setAnswers(nextAnswers);
    setIndex(prevIndex);
  }

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
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="text-sm text-white/60 hover:text-white underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={index === 0}
            >
              Back
            </button>
            <button
              onClick={resetTest}
              className="text-sm text-white/60 hover:text-white underline underline-offset-4"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mb-6 h-1.5 w-full rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-2xl">
          <h2 className="mb-6 mt-2 text-xl font-semibold leading-snug tracking-tight">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {SCALE.map((s) => (
              <button
                key={s.v}
                onClick={() => handleAnswer(s.v)}
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
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-white/55">
            Tip: answer intuitively — there are no wrong answers.
          </p>
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Personality test
        </p>
      </div>
    </main>
  );
}
