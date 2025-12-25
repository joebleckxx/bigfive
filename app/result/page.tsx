"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TRAIT_BY_QID, TRAIT_LABELS, type Trait } from "@/lib/questions";
import { scoreBigFive, type AnswersMap } from "@/lib/scoring";

const ANSWERS_KEY = "bigfive_answers_v1";
const PAID_KEY = "bigfive_paid_v1";

function levelLabel(percent: number) {
  if (percent < 34) return "Niski";
  if (percent < 67) return "Średni";
  return "Wysoki";
}

function levelDescription(percent: number) {
  if (percent < 34) return "Ta cecha jest raczej słabiej zaznaczona w Twoim profilu.";
  if (percent < 67) return "Ta cecha jest na zbalansowanym poziomie – elastyczność w zachowaniach.";
  return "Ta cecha jest mocno zaznaczona – wyraźnie wpływa na Twój styl działania.";
}

export default function ResultPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const paid = localStorage.getItem(PAID_KEY) === "true";
    setAllowed(paid);
    setMounted(true);
    if (!paid) router.replace("/pay");
  }, [router]);

  const scores = useMemo(() => {
    if (!mounted || !allowed) return null;
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      if (!raw) return null;
      const answers = JSON.parse(raw) as AnswersMap;
      return scoreBigFive(answers, TRAIT_BY_QID);
    } catch {
      return null;
    }
  }, [mounted, allowed]);

  function resetAll() {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(PAID_KEY);
    router.push("/test");
  }

  if (!mounted) return null;
  if (!allowed) return null;
  if (!scores) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-2">Brak danych</h1>
          <p className="text-gray-600 mb-6">
            Nie widzę zapisanych odpowiedzi. Wróć do testu i odpowiedz na pytania.
          </p>
          <button
            onClick={() => router.push("/test")}
            className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
            type="button"
          >
            Wróć do testu
          </button>
        </div>
      </main>
    );
  }

  const orderedTraits: Trait[] = ["O", "C", "E", "A", "S"];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Twój profil osobowości</h1>
            <p className="text-gray-600">Wynik oparty na modelu Big Five</p>
          </div>

          <button
            onClick={resetAll}
            className="text-sm text-gray-600 hover:text-black underline"
            type="button"
          >
            Zrób test od nowa
          </button>
        </div>

        <div className="space-y-6">
          {orderedTraits.map((t) => {
            const data = scores[t];
            return (
              <div key={t} className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{TRAIT_LABELS[t]}</h2>
                  <div className="text-right">
                    <div className="text-sm font-medium">{data.percent}%</div>
                    <div className="text-xs text-gray-600">{levelLabel(data.percent)}</div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className="bg-black h-3 rounded-full"
                    style={{ width: `${data.percent}%` }}
                  />
                </div>

                <p className="text-gray-700 text-sm">{levelDescription(data.percent)}</p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-8">
          Uwaga: To narzędzie ma charakter informacyjny/rozwojowy, nie stanowi diagnozy klinicznej.
        </p>
      </div>
    </main>
  );
}
