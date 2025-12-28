import type { Trait, Question } from "./personality";

export type TraitScores = Record<Trait, { raw: number; percent: number; count: number }>;

/**
 * Liczy wyniki Big Five z odpowiedzi i listy pytań (QUESTIONS).
 * - answers: tablica 1..5 o długości = questions.length
 * - reverse: odwraca skalę (6 - answer)
 */
export function scoreTraits(answers: number[], questions: readonly Question[]): TraitScores {
  const raw: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };
  const count: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers[i];

    if (!Number.isInteger(a) || a < 1 || a > 5) continue;

    const v = q.reverse ? 6 - a : a;
    raw[q.trait] += v;
    count[q.trait] += 1;
  }

  const out = {} as TraitScores;

  (Object.keys(raw) as Trait[]).forEach((t) => {
    const c = count[t] || 0;

    // jeśli brak pytań w trait (nie powinno się zdarzyć) -> 50%
    if (c === 0) {
      out[t] = { raw: 0, percent: 50, count: 0 };
      return;
    }

    const min = 1 * c;
    const max = 5 * c;
    const norm = (raw[t] - min) / (max - min);
    const percent = Math.round(Math.max(0, Math.min(1, norm)) * 100);

    out[t] = { raw: raw[t], percent, count: c };
  });

  return out;
}

/**
 * Stabilność emocjonalna = 100 - Neurotyczność (N) w %.
 */
export function stabilityFromScores(scores: Pick<TraitScores, "N">): number {
  return Math.round(100 - scores.N.percent);
}
