import { QUESTIONS, Trait, questionsFromOrder } from "./personality";

/**
 * Wynik zapisywany do localStorage / payload
 */
export type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  questionOrder?: string[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: ProfileId;
};

export type ProfileId =
  | "P01" | "P02" | "P03" | "P04"
  | "P05" | "P06" | "P07" | "P08"
  | "P09" | "P10" | "P11" | "P12"
  | "P13" | "P14" | "P15" | "P16";

/* --------------------------------------------------
 * Helpers
 * -------------------------------------------------- */

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

/**
 * Deadzone thresholds
 */
const DEAD_LOW = 45;
const DEAD_HIGH = 55;

const axisBit = (v: number): 0 | 1 =>
  v <= DEAD_LOW ? 0 : v >= DEAD_HIGH ? 1 : v >= 50 ? 1 : 0;

/**
 * Normalizacja odpowiedzi 1–5 → 0–100
 * z uwzględnieniem pytań odwróconych
 */
function answerToScore(v: number, reverse?: boolean): number {
  const raw = ((v - 1) / 4) * 100;
  return clamp(reverse ? 100 - raw : raw);
}

/**
 * Liczy Big Five na podstawie odpowiedzi i KOLEJNOŚCI pytań.
 */
function computeBigFiveScores(answers: number[], questionOrder?: string[]) {
  const sums: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };
  const counts: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };

  const orderedQuestions = questionsFromOrder(questionOrder);

  orderedQuestions.forEach((q, i) => {
    const v = answers[i];
    if (v < 1 || v > 5) return;

    const score = answerToScore(v, q.reverse);
    sums[q.trait] += score;
    counts[q.trait] += 1;
  });

  return {
    E: clamp(sums.E / Math.max(1, counts.E)),
    O: clamp(sums.O / Math.max(1, counts.O)),
    C: clamp(sums.C / Math.max(1, counts.C)),
    A: clamp(sums.A / Math.max(1, counts.A)),
    N: clamp(sums.N / Math.max(1, counts.N))
  };
}

/**
 * Stability (0–100) — liczona na 4 osiach
 */
export function computeStability(scores: Record<Trait, number>): number {
  const axes = [
    scores.E,
    scores.C,
    (scores.A + (100 - scores.O)) / 2,
    100 - scores.N
  ];

  const avg =
    axes.reduce((a, v) => a + Math.abs(v - 50), 0) / axes.length;

  return clamp(avg);
}

/**
 * Big Five → 4 osie → ProfileId (P01–P16)
 *
 * Osie:
 * SE = E
 * ST = C
 * OR = (A + (100 − O)) / 2
 * SB = 100 − N
 */
function profileIdFromScores(scores: Record<Trait, number>): ProfileId {
  const SE = scores.E;
  const ST = scores.C;
  const OR = (scores.A + (100 - scores.O)) / 2;
  const SB = 100 - scores.N;

  const index =
    (axisBit(SE) << 3) |
    (axisBit(ST) << 2) |
    (axisBit(OR) << 1) |
    axisBit(SB);

  return `P${String(index + 1).padStart(2, "0")}` as ProfileId;
}

/* --------------------------------------------------
 * Public: build result
 * -------------------------------------------------- */

export function buildStoredResultV1(
  answers: number[],
  questionOrder?: string[]
): StoredResultV1 {
  const scores = computeBigFiveScores(answers, questionOrder);
  const usedOrder =
    questionOrder && questionOrder.length === QUESTIONS.length
      ? questionOrder
      : QUESTIONS.map((q) => q.id);

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    answers,
    questionOrder: usedOrder,
    scores,
    stability: computeStability(scores),
    typeCode: profileIdFromScores(scores)
  };
}

export { buildStoredResultV1 as calculateResult };