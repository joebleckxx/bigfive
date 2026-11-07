import { QUESTIONS, type Trait } from "./personality";

/** A conservative description of a completed scale, not a validated confidence estimate. */
export function preliminaryObservation(answers: number[], order: string[]): string | null {
  if (answers.length !== QUESTIONS.length || order.length !== QUESTIONS.length || new Set(order).size !== QUESTIONS.length) return null;
  const byId = new Map(QUESTIONS.map((question) => [question.id, question]));
  if (order.some((id) => !byId.has(id))) return null;
  const valid = (value: number) => Number.isInteger(value) && value >= 1 && value <= 5;
  // Only the first twenty answers may inform this intermission, including after going back.
  if (!answers.slice(0, 20).every(valid)) return null;
  const values: Record<Trait, number[]> = { E: [], O: [], C: [], A: [], N: [] };
  order.slice(0, 20).forEach((id, index) => {
    const question = byId.get(id)!;
    const value = answers[index];
    values[question.trait].push(question.reverse ? 6 - value : value);
  });
  const candidates = (Object.keys(values) as Trait[]).flatMap((trait) => {
    const responses = values[trait];
    const total = QUESTIONS.filter((question) => question.trait === trait).length;
    if (responses.length !== total) return [];
    const mean = responses.reduce((sum, value) => sum + value, 0) / total;
    const high = mean >= 3.8 && responses.filter((value) => value >= 4).length >= 4;
    const low = mean <= 2.2 && responses.filter((value) => value <= 2).length >= 4;
    return high || low ? [{ key: `${trait}${high ? "High" : "Low"}`, strength: Math.abs(mean - 3) }] : [];
  });
  candidates.sort((a, b) => b.strength - a.strength);
  return candidates[0]?.key ?? null;
}
