import { QUESTIONS, Trait, questionsFromOrder } from "./personality";

/**
 * Wynik zapisywany do localStorage / payload
 */
export type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];

  /**
   * Kolejność pytań użyta w tej sesji (losowana raz na start testu).
   * Opcjonalne dla kompatybilności ze starymi zapisami.
   */
  questionOrder?: string[];

  scores: Record<Trait, number>;
  stability: number;
  typeCode: ProfileId;
  addOns: {
    stressKey: StressKey;
    subtypeKey: SubtypeKey;
    modeKey: ModeKey;
  };
};

export type ProfileId =
  | "P01" | "P02" | "P03" | "P04"
  | "P05" | "P06" | "P07" | "P08"
  | "P09" | "P10" | "P11" | "P12"
  | "P13" | "P14" | "P15" | "P16";

export type StressKey = "sensitive" | "steady";

export type SubtypeKey =
  | "empathicVisionary"
  | "independentInnovator"
  | "supportivePragmatist"
  | "directRealist";

export type ModeKey =
  | "driveDeliver"
  | "planPerfect"
  | "exploreAdapt"
  | "flowImprovise";

/* --------------------------------------------------
 * Helpers
 * -------------------------------------------------- */

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

const hi = (v: number) => v >= 50;

/**
 * Normalizacja odpowiedzi 1–5 → 0–100
 * z uwzględnieniem pytań odwróconych
 */
function answerToScore(v: number, reverse?: boolean): number {
  const raw = ((v - 1) / 4) * 100; // 1..5 => 0..100
  return clamp(reverse ? 100 - raw : raw);
}

/**
 * Liczy Big Five na podstawie odpowiedzi i KOLEJNOŚCI pytań.
 * Jeśli questionOrder nie ma (stare zapisy), używa defaultowej kolejności.
 */
function computeBigFiveScores(answers: number[], questionOrder?: string[]) {
  const sums: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };
  const counts: Record<Trait, number> = {
    E: 0,
    O: 0,
    C: 0,
    A: 0,
    N: 0
  };

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

/* --------------------------------------------------
 * Stability (0–100)
 * -------------------------------------------------- */

export function computeStability(scores: Record<Trait, number>): number {
  const distances = [
    Math.abs(scores.E - 50),
    Math.abs(scores.O - 50),
    Math.abs(scores.C - 50),
    Math.abs(scores.A - 50),
    Math.abs(scores.N - 50)
  ];

  const avg = distances.reduce((a, b) => a + b, 0) / distances.length;

  return clamp(avg);
}

/* --------------------------------------------------
 * 16-profile mapping (autorskie)
 * -------------------------------------------------- */

function profileIdFromBigFive(scores: Record<Trait, number>): ProfileId {
  const key =
    (hi(scores.E) ? "H" : "L") +
    "_" +
    (hi(scores.O) ? "H" : "L") +
    "_" +
    (hi(scores.C) ? "H" : "L") +
    "_" +
    (hi(scores.A) ? "H" : "L") +
    "_" +
    (hi(scores.N) ? "H" : "L");

  const MAP: Record<string, ProfileId> = {
    "L_L_L_H_H": "P01",
    "L_H_L_H_H": "P02",
    "H_L_L_H_H": "P03",
    "H_H_L_H_H": "P04",

    "L_L_H_H_H": "P05",
    "L_H_H_H_H": "P06",
    "H_L_H_H_H": "P07",
    "H_H_H_H_H": "P08",

    "L_L_L_L_L": "P09",
    "L_H_L_L_L": "P10",
    "H_L_L_L_L": "P11",
    "H_H_L_L_L": "P12",

    "L_L_H_L_L": "P13",
    "L_H_H_L_L": "P14",
    "H_L_H_L_L": "P15",
    "H_H_H_L_L": "P16"
  };

  return MAP[key] ?? "P01";
}

/* --------------------------------------------------
 * Add-ons (klucze językowo neutralne)
 * -------------------------------------------------- */

function computeAddOns(scores: Record<Trait, number>) {
  const stressKey: StressKey = hi(scores.N) ? "sensitive" : "steady";

  const subtypeKey: SubtypeKey =
    hi(scores.O) && hi(scores.A)
      ? "empathicVisionary"
      : hi(scores.O) && !hi(scores.A)
        ? "independentInnovator"
        : !hi(scores.O) && hi(scores.A)
          ? "supportivePragmatist"
          : "directRealist";

  const modeKey: ModeKey =
    hi(scores.C) && hi(scores.E)
      ? "driveDeliver"
      : hi(scores.C) && !hi(scores.E)
        ? "planPerfect"
        : !hi(scores.C) && hi(scores.E)
          ? "exploreAdapt"
          : "flowImprovise";

  return { stressKey, subtypeKey, modeKey };
}

/* --------------------------------------------------
 * Public: build result
 * -------------------------------------------------- */

/**
 * Jeśli UI tasuje pytania, przekaż `questionOrder`,
 * a zapis i scoring będą poprawne.
 */
export function buildStoredResultV1(answers: number[], questionOrder?: string[]): StoredResultV1 {
  const scores = computeBigFiveScores(answers, questionOrder);
  const usedOrder =
    questionOrder && questionOrder.length === QUESTIONS.length
      ? questionOrder
      : QUESTIONS.map((q) => q.id);

  const stability = computeStability(scores);
  const typeCode = profileIdFromBigFive(scores);
  const addOns = computeAddOns(scores);

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    answers,
    questionOrder: usedOrder,
    scores,
    stability,
    typeCode,
    addOns
  };
}
export { buildStoredResultV1 as calculateResult }