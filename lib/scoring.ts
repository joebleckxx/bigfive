import type { Trait } from "./questions";

export type AnswersMap = Record<number, number>; // questionId -> 1..5
export type TraitScores = Record<Trait, { raw: number; percent: number }>;

const TRAITS: Trait[] = ["O", "C", "E", "A", "S"];

export function scoreBigFive(answers: AnswersMap, traitByQuestionId: Record<number, Trait>): TraitScores {
  const raw: Record<Trait, number> = { O: 0, C: 0, E: 0, A: 0, S: 0 };

  for (const [qidStr, value] of Object.entries(answers)) {
    const qid = Number(qidStr);
    const trait = traitByQuestionId[qid];
    if (!trait) continue;
    const v = Number(value);
    if (v < 1 || v > 5) continue;
    raw[trait] += v;
  }

  const out = {} as TraitScores;
  for (const t of TRAITS) {
    const r = raw[t]; // min=5 max=25 (zakładamy 5 pytań na cechę)
    const percent = Math.round(((r - 5) / 20) * 100);
    out[t] = { raw: r, percent: Math.max(0, Math.min(100, percent)) };
  }
  return out;
}
