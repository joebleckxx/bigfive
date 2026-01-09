export type Trait = "E" | "O" | "C" | "A" | "N";

export type Question = {
  id: string;
  trait: Trait;
  reverse?: boolean;
};

export type StressKey = "sensitive" | "steady";
export type SubtypeKey =
  | "empathicVisionary"
  | "independentInnovator"
  | "supportivePragmatist"
  | "directRealist";
export type ModeKey = "driveDeliver" | "planPerfect" | "exploreAdapt" | "flowImprovise";

export type ProfileId =
  | "P01" | "P02" | "P03" | "P04"
  | "P05" | "P06" | "P07" | "P08"
  | "P09" | "P10" | "P11" | "P12"
  | "P13" | "P14" | "P15" | "P16";

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

  // zostawiamy opcjonalnie dla kompatybilności ze starymi zapisami
  typeName?: string;
  typeDescription?: string;

  // NOWE: językowo neutralne klucze
  addOns: {
    stressKey: StressKey;
    subtypeKey: SubtypeKey;
    modeKey: ModeKey;
  };
};

export const QUESTIONS: Question[] = [
  // E — Extraversion
  { id: "E1", trait: "E" },
  { id: "E2", trait: "E" },
  { id: "E3", trait: "E" },
  { id: "E4", trait: "E" },
  { id: "E5", trait: "E", reverse: true },

  // O — Openness
  { id: "O1", trait: "O" },
  { id: "O2", trait: "O" },
  { id: "O3", trait: "O" },
  { id: "O4", trait: "O" },
  { id: "O5", trait: "O", reverse: true },

  // C — Conscientiousness
  { id: "C1", trait: "C" },
  { id: "C2", trait: "C" },
  { id: "C3", trait: "C" },
  { id: "C4", trait: "C" },
  { id: "C5", trait: "C", reverse: true },

  // A — Agreeableness
  { id: "A1", trait: "A" },
  { id: "A2", trait: "A" },
  { id: "A3", trait: "A" },
  { id: "A4", trait: "A" },
  { id: "A5", trait: "A", reverse: true },

  // N — Neuroticism (wynik pokazujemy jako Stability)
  { id: "N1", trait: "N" },
  { id: "N2", trait: "N" },
  { id: "N3", trait: "N" },
  { id: "N4", trait: "N" },
  { id: "N5", trait: "N", reverse: true }
];

/* --------------------------------------------------
 * Random / constrained question order (soft shuffle)
 * -------------------------------------------------- */

export const DEFAULT_QUESTION_ORDER: string[] = QUESTIONS.map((q) => q.id);

const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q])
);

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function violatesMaxRun(order: Question[], maxSameTraitInRow: number): boolean {
  if (maxSameTraitInRow <= 0) return false;
  let run = 1;
  for (let i = 1; i < order.length; i++) {
    if (order[i].trait === order[i - 1].trait) run++;
    else run = 1;
    if (run > maxSameTraitInRow) return true;
  }
  return false;
}

/**
 * Tworzy losową kolejność pytań (deterministycznie względem seed),
 * z miękkim ograniczeniem: maks. `maxSameTraitInRow` pytań tej samej cechy z rzędu.
 *
 * - seed powinien być zapisany w localStorage i stały dla danej sesji testu
 * - wynik to tablica ID pytań (np. ["E3","O1",...])
 */
export function makeQuestionOrder(seed: string, maxSameTraitInRow = 2): string[] {
  const seedFn = xmur3(seed);
  const rand = mulberry32(seedFn());

  // start: klasyczny shuffle
  const bag = shuffleInPlace([...QUESTIONS], rand);

  // build z ograniczeniem
  const out: Question[] = [];
  while (bag.length) {
    const last = out[out.length - 1];
    const last2 = out[out.length - 2];

    const pickIndex = bag.findIndex((q) => {
      if (maxSameTraitInRow <= 1) return true;
      if (!last) return true;
      if (q.trait !== last.trait) return true;
      // q ma ten sam trait co last -> dopuszczamy tylko jeśli last2 ma inny
      return !last2 || last2.trait !== q.trait;
    });

    const idx = pickIndex >= 0 ? pickIndex : 0; // awaryjnie bierzemy cokolwiek (test jest mały)
    out.push(bag.splice(idx, 1)[0]);
  }

  // sanity: jeśli mimo wszystko constraint jest złamany, robimy fallback na zwykły shuffle
  if (violatesMaxRun(out, maxSameTraitInRow)) {
    const fallback = shuffleInPlace([...QUESTIONS], rand);
    return fallback.map((q) => q.id);
  }

  return out.map((q) => q.id);
}

export function questionsFromOrder(order?: string[]): Question[] {
  if (!order || order.length !== QUESTIONS.length) return QUESTIONS;

  const mapped: Question[] = [];
  for (const id of order) {
    const q = QUESTION_BY_ID[id];
    if (!q) return QUESTIONS; // fallback na bezpieczeństwo
    mapped.push(q);
  }
  return mapped;
}

export type ScaleOption = {
  v: 1 | 2 | 3 | 4 | 5;
  key: "1" | "2" | "3" | "4" | "5";
};

export const SCALE: ScaleOption[] = [
  { v: 1, key: "1" },
  { v: 2, key: "2" },
  { v: 3, key: "3" },
  { v: 4, key: "4" },
  { v: 5, key: "5" }
];

/**
 * Autorski, legal-safe idea:
 * - wynik 16-typowy to własna mapa na bazie progów big-five (H/L),
 * - bez użycia 4-literowych kodów MBTI i bez ich terminologii.
 */
function profileIdFromKey(key: string): ProfileId {
  const MAP: Record<string, ProfileId> = {
    "L_L_L_H": "P01",
    "L_H_L_H": "P02",
    "H_L_L_H": "P03",
    "H_H_L_H": "P04",

    "L_L_H_H": "P05",
    "L_H_H_H": "P06",
    "H_L_H_H": "P07",
    "H_H_H_H": "P08",

    "L_L_L_L": "P09",
    "L_H_L_L": "P10",
    "H_L_L_L": "P11",
    "H_H_L_L": "P12",

    "L_L_H_L": "P13",
    "L_H_H_L": "P14",
    "H_L_H_L": "P15",
    "H_H_H_L": "P16"
  };

  return MAP[key] ?? "P01";
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function answerToScore(v: number, reverse?: boolean): number {
  // 1..5 => 0..100
  const raw = ((v - 1) / 4) * 100;
  const score = reverse ? 100 - raw : raw;
  return clamp(score);
}

function computeStability(scores: Record<Trait, number>): number {
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

function profileIdFromBigFive(scores: Record<Trait, number>): ProfileId {
  const key = [
    scores.E >= 50 ? "H" : "L",
    scores.O >= 50 ? "H" : "L",
    scores.C >= 50 ? "H" : "L",
    scores.A >= 50 ? "H" : "L"
  ].join("_") + "_" + (scores.N >= 50 ? "H" : "L");

  return profileIdFromKey(key);
}

// KLUCZE add-ons (językowo neutralne)
function deriveAddOnKeys(scores: Record<Trait, number>) {
  const highE = scores.E >= 50;
  const highO = scores.O >= 50;
  const highC = scores.C >= 50;
  const highA = scores.A >= 50;
  const highN = scores.N >= 50;

  const stressKey: StressKey = highN ? "sensitive" : "steady";

  const subtypeKey: SubtypeKey =
    highO && highA
      ? "empathicVisionary"
      : highO && !highA
        ? "independentInnovator"
        : !highO && highA
          ? "supportivePragmatist"
          : "directRealist";

  const modeKey: ModeKey =
    highC && highE
      ? "driveDeliver"
      : highC && !highE
        ? "planPerfect"
        : !highC && highE
          ? "exploreAdapt"
          : "flowImprovise";

  return { stressKey, subtypeKey, modeKey };
}

/**
 * Najważniejsze: jeśli UI tasuje pytania,
 * musi przekazać `questionOrder`, żeby mapping answers[i] -> pytanie był poprawny.
 */
export function computeResult(answers: number[], questionOrder?: string[]): StoredResultV1 {
  const sums: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };
  const counts: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };

  const orderedQuestions = questionsFromOrder(questionOrder);
  const usedOrder =
    questionOrder && questionOrder.length === QUESTIONS.length
      ? questionOrder
      : DEFAULT_QUESTION_ORDER;

  for (let i = 0; i < orderedQuestions.length; i++) {
    const q = orderedQuestions[i];
    const v = answers[i];
    if (v < 1 || v > 5) continue;

    const score = answerToScore(v, q.reverse);
    sums[q.trait] += score;
    counts[q.trait] += 1;
  }

  const scores: Record<Trait, number> = {
    E: clamp(sums.E / Math.max(1, counts.E)),
    O: clamp(sums.O / Math.max(1, counts.O)),
    C: clamp(sums.C / Math.max(1, counts.C)),
    A: clamp(sums.A / Math.max(1, counts.A)),
    N: clamp(sums.N / Math.max(1, counts.N))
  };

  const stability = computeStability(scores);
  const typeCode = profileIdFromBigFive(scores);
  const { stressKey, subtypeKey, modeKey } = deriveAddOnKeys(scores);

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    answers,
    questionOrder: usedOrder,
    scores,
    stability,
    typeCode,
    typeName: undefined,
    typeDescription: undefined,
    addOns: { stressKey, subtypeKey, modeKey }
  };
}
