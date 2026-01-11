export type Trait = "E" | "O" | "C" | "A" | "N";

export type Question = {
  id: string;
  trait: Trait;
  reverse?: boolean;
};

export type ProfileId =
  | "P01" | "P02" | "P03" | "P04"
  | "P05" | "P06" | "P07" | "P08"
  | "P09" | "P10" | "P11" | "P12"
  | "P13" | "P14" | "P15" | "P16";

export type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  questionOrder?: string[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: ProfileId;
  typeName?: string;
  typeDescription?: string;
};

export const QUESTIONS: Question[] = [
  { id: "E1", trait: "E" },
  { id: "E2", trait: "E" },
  { id: "E3", trait: "E" },
  { id: "E4", trait: "E" },
  { id: "E5", trait: "E", reverse: true },

  { id: "O1", trait: "O" },
  { id: "O2", trait: "O" },
  { id: "O3", trait: "O" },
  { id: "O4", trait: "O" },
  { id: "O5", trait: "O", reverse: true },

  { id: "C1", trait: "C" },
  { id: "C2", trait: "C" },
  { id: "C3", trait: "C" },
  { id: "C4", trait: "C" },
  { id: "C5", trait: "C", reverse: true },

  { id: "A1", trait: "A" },
  { id: "A2", trait: "A" },
  { id: "A3", trait: "A" },
  { id: "A4", trait: "A" },
  { id: "A5", trait: "A", reverse: true },

  { id: "N1", trait: "N" },
  { id: "N2", trait: "N" },
  { id: "N3", trait: "N" },
  { id: "N4", trait: "N" },
  { id: "N5", trait: "N", reverse: true }
];

export const DEFAULT_QUESTION_ORDER = QUESTIONS.map((q) => q.id);

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

export function makeQuestionOrder(seed: string, maxSameTraitInRow = 2): string[] {
  const seedFn = xmur3(seed);
  const rand = mulberry32(seedFn());

  const bag = shuffleInPlace([...QUESTIONS], rand);
  const out: Question[] = [];

  while (bag.length) {
    const last = out[out.length - 1];
    const last2 = out[out.length - 2];

    const pickIndex = bag.findIndex((q) => {
      if (!last) return true;
      if (q.trait !== last.trait) return true;
      return !last2 || last2.trait !== q.trait;
    });

    out.push(bag.splice(pickIndex >= 0 ? pickIndex : 0, 1)[0]);
  }

  if (violatesMaxRun(out, maxSameTraitInRow)) {
    return shuffleInPlace([...QUESTIONS], rand).map((q) => q.id);
  }

  return out.map((q) => q.id);
}

export function questionsFromOrder(order?: string[]): Question[] {
  if (!order || order.length !== QUESTIONS.length) return QUESTIONS;

  const mapped: Question[] = [];
  for (const id of order) {
    const q = QUESTION_BY_ID[id];
    if (!q) return QUESTIONS;
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