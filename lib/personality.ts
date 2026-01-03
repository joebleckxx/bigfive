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

export type ScaleOption = {
  v: 1 | 2 | 3 | 4 | 5;
  key: "1" | "2" | "3" | "4" | "5";
};

// Skala odpowiedzi do i18n (messages/*) pod namespace "Scale":
// useTranslations("Scale")(option.key)
export const SCALE: readonly ScaleOption[] = [
  { v: 1, key: "1" },
  { v: 2, key: "2" },
  { v: 3, key: "3" },
  { v: 4, key: "4" },
  { v: 5, key: "5" }
] as const;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function scoreToPct(sum: number, count: number) {
  // answers 1..5 -> normalize 0..1 -> 0..100
  const min = 1 * count;
  const max = 5 * count;
  const norm = (sum - min) / (max - min);
  return Math.round(clamp01(norm) * 100);
}

// Map Big Five scores to a 16-profile id (P01-P16), no MBTI codes.
function toProfileId(scores: Record<Trait, number>): ProfileId {
  const highE = scores.E >= 50;
  const highO = scores.O >= 50;
  const highC = scores.C >= 50;
  const highA = scores.A >= 50;
  const highN = scores.N >= 50;

  const SE = highE; // social energy
  const ST = highC; // structure
  const OR = (scores.A + (100 - scores.O)) / 2 >= 50; // people vs ideas
  const SB = (100 - scores.N) >= 50; // emotional stability

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

// KLUCZE add-ons (językowo neutralne)
function deriveAddOnKeys(scores: Record<Trait, number>) {
  const highE = scores.E >= 50;
  const highO = scores.O >= 50;
  const highC = scores.C >= 50;
  const highA = scores.A >= 50;
  const highN = scores.N >= 50;

  const stressKey: StressKey = highN ? "sensitive" : "steady";

  const subtypeKey: SubtypeKey = highO
    ? highA
      ? "empathicVisionary"
      : "independentInnovator"
    : highA
      ? "supportivePragmatist"
      : "directRealist";

  const modeKey: ModeKey = highC
    ? highE
      ? "driveDeliver"
      : "planPerfect"
    : highE
      ? "exploreAdapt"
      : "flowImprovise";

  return { stressKey, subtypeKey, modeKey };
}

export function computeResult(answers: number[]): StoredResultV1 {
  // sum by trait
  const sums: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };
  const counts: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const raw = answers[i] ?? 0;
    if (!(raw >= 1 && raw <= 5)) continue;

    const v = q.reverse ? 6 - raw : raw;
    sums[q.trait] += v;
    counts[q.trait] += 1;
  }

  const scores: Record<Trait, number> = {
    E: counts.E ? scoreToPct(sums.E, counts.E) : 50,
    O: counts.O ? scoreToPct(sums.O, counts.O) : 50,
    C: counts.C ? scoreToPct(sums.C, counts.C) : 50,
    A: counts.A ? scoreToPct(sums.A, counts.A) : 50,
    N: counts.N ? scoreToPct(sums.N, counts.N) : 50
  };

  // stability = inverse of neuroticism
  const stability = Math.round(100 - scores.N);

  const typeCode = toProfileId(scores);
  const { stressKey, subtypeKey, modeKey } = deriveAddOnKeys(scores);

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    answers,
    scores,
    stability,
    typeCode,

    // nie zapisujemy tekstów (język zależy od UI)
    typeName: undefined,
    typeDescription: undefined,

    addOns: { stressKey, subtypeKey, modeKey }
  };
}
