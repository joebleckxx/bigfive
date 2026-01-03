import { QUESTIONS, Trait } from "./personality";

/**
 * Wynik zapisywany do localStorage / payload
 */
export type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: ProfileId;
  addOns: {
    stressKey: StressKey;
    subtypeKey: SubtypeKey;
    modeKey: ModeKey;
  };
};

/**
 * Autorski, legal-safe identyfikator profilu
 */
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
  const base = ((v - 1) / 4) * 100; // 1..5 -> 0..100
  return reverse ? 100 - base : base;
}

/* --------------------------------------------------
 * Big Five scoring
 * -------------------------------------------------- */

export function computeBigFiveScores(
  answers: number[]
): Record<Trait, number> {
  const sums: Record<Trait, number> = {
    E: 0,
    O: 0,
    C: 0,
    A: 0,
    N: 0
  };

  const counts: Record<Trait, number> = {
    E: 0,
    O: 0,
    C: 0,
    A: 0,
    N: 0
  };

  QUESTIONS.forEach((q, i) => {
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
 * Stability (pewność profilu)
 * im bliżej 50 i im więcej osi blisko środka,
 * tym niższa stabilność
 * -------------------------------------------------- */

export function computeStability(
  scores: Record<Trait, number>
): number {
  const distances = [
    Math.abs(scores.E - 50),
    Math.abs(scores.O - 50),
    Math.abs(scores.C - 50),
    Math.abs(scores.A - 50),
    Math.abs(scores.N - 50)
  ];

  const avg = distances.reduce((a, b) => a + b, 0) / distances.length;

  // 0..50 -> 0..100
  return clamp(Math.round((avg / 50) * 100));
}

/* --------------------------------------------------
 * Big Five → 16 profili (P01–P16)
 *
 * Osi używamy 4:
 * SE = E
 * ST = C
 * OR = (A + (100 - O)) / 2
 * SB = (100 - N)
 * -------------------------------------------------- */

export function profileIdFromBigFive(
  scores: Record<Trait, number>
): ProfileId {
  const SE = hi(scores.E); // social energy
  const ST = hi(scores.C); // structure
  const OR = hi((scores.A + (100 - scores.O)) / 2); // people vs ideas
  const SB = hi(100 - scores.N); // emotional stability

  const key =
    `${SE ? "H" : "L"}_` +
    `${ST ? "H" : "L"}_` +
    `${OR ? "H" : "L"}_` +
    `${SB ? "H" : "L"}`;

  const MAP: Record<string, ProfileId> = {
    "L_H_L_H": "P01",
    "L_L_L_H": "P02",
    "H_H_L_H": "P03",
    "H_L_L_H": "P04",

    "L_H_H_L": "P05",
    "L_L_H_L": "P06",
    "H_H_H_L": "P07",
    "H_L_H_L": "P08",

    "L_H_H_H": "P09",
    "L_L_H_H": "P10",
    "H_H_H_H": "P11",
    "H_L_H_H": "P12",

    "L_L_L_L": "P13",
    "L_H_L_L": "P14",
    "H_L_L_L": "P15",
    "H_H_L_L": "P16"
  };

  return MAP[key] ?? "P01";
}

/* --------------------------------------------------
 * Add-ons (klucze do tłumaczeń AddOns.*)
 * -------------------------------------------------- */

export function computeAddOns(scores: Record<Trait, number>) {
  const stressKey: StressKey = scores.N >= 55 ? "sensitive" : "steady";

  // subtype: O (ideas/novelty) x A (people/warmth)
  const Ohi = hi(scores.O);
  const Ahi = hi(scores.A);

  const subtypeKey: SubtypeKey =
    Ohi && Ahi ? "empathicVisionary" :
    Ohi && !Ahi ? "independentInnovator" :
    !Ohi && Ahi ? "supportivePragmatist" :
    "directRealist";

  // mode: E (pace/drive) x C (structure/discipline)
  const Ehi = hi(scores.E);
  const Chi = hi(scores.C);

  const modeKey: ModeKey =
    Ehi && Chi ? "driveDeliver" :
    !Ehi && Chi ? "planPerfect" :
    Ehi && !Chi ? "exploreAdapt" :
    "flowImprovise";

  return { stressKey, subtypeKey, modeKey };
}

/* --------------------------------------------------
 * Główna funkcja: answers[] → StoredResultV1
 * -------------------------------------------------- */

export function calculateResult(
  answers: number[]
): StoredResultV1 {
  const scores = computeBigFiveScores(answers);
  const stability = computeStability(scores);
  const typeCode = profileIdFromBigFive(scores);
  const addOns = computeAddOns(scores);

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    answers,
    scores,
    stability,
    typeCode,
    addOns
  };
}