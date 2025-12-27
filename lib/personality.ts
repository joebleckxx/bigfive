export type Trait = "E" | "O" | "C" | "A" | "N";

export type Question = {
  id: string;
  trait: Trait;
  text: string;
  reverse?: boolean;
};

export type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: string;
  typeName: string;
  typeDescription: string;
  addOns: {
    stressProfile: { label: string; note: string };
    subtype: { label: string; note: string };
    mode: { label: string; note: string };
  };
};

export const QUESTIONS: Question[] = [
  // E — Extraversion
  {
    id: "E1",
    trait: "E",
    text: "I find it easy to start conversations with new people.",
  },
  {
    id: "E2",
    trait: "E",
    text: "After a long day, I prefer socializing over being alone.",
  },
  { id: "E3", trait: "E", text: "I often take the initiative in a group." },
  {
    id: "E4",
    trait: "E",
    text: "I feel comfortable being the center of attention.",
  },
  {
    id: "E5",
    trait: "E",
    text: "I usually prefer listening rather than talking.",
    reverse: true,
  },

  // O — Openness
  {
    id: "O1",
    trait: "O",
    text: "I enjoy trying new ideas, even if they are unconventional.",
  },
  {
    id: "O2",
    trait: "O",
    text: "I'm drawn to abstract topics (ideas, philosophy, the future).",
  },
  { id: "O3", trait: "O", text: "I get bored with routine and look for variety." },
  { id: "O4", trait: "O", text: "I value creativity more than tradition." },
  {
    id: "O5",
    trait: "O",
    text: "I prefer proven methods over experimentation.",
    reverse: true,
  },

  // C — Conscientiousness
  { id: "C1", trait: "C", text: "I usually plan tasks and stick to the plan." },
  {
    id: "C2",
    trait: "C",
    text: "Deadlines matter to me, and I actively protect them.",
  },
  {
    id: "C3",
    trait: "C",
    text: "I like having things organized and structured.",
  },
  {
    id: "C4",
    trait: "C",
    text: "I finish what I start, even when motivation drops.",
  },
  {
    id: "C5",
    trait: "C",
    text: "I often do things at the last minute.",
    reverse: true,
  },

  // A — Agreeableness
  {
    id: "A1",
    trait: "A",
    text: "It's easy for me to understand other people's perspective.",
  },
  {
    id: "A2",
    trait: "A",
    text: "Warmth and respect in relationships are important to me.",
  },
  {
    id: "A3",
    trait: "A",
    text: "In conflict, I prefer compromise over winning.",
  },
  {
    id: "A4",
    trait: "A",
    text: "I often support others, even when it's not convenient.",
  },
  {
    id: "A5",
    trait: "A",
    text: "I can be blunt, even if it hurts someone's feelings.",
    reverse: true,
  },

  // N — Neuroticism (we show as Emotional Stability on results)
  { id: "N1", trait: "N", text: "I get stressed easily, even by small things." },
  {
    id: "N2",
    trait: "N",
    text: "It's hard for me to calm down after an unpleasant situation.",
  },
  { id: "N3", trait: "N", text: "I often worry ahead of time." },
  { id: "N4", trait: "N", text: "My mood can change quickly." },
  {
    id: "N5",
    trait: "N",
    text: "I usually stay calm under pressure.",
    reverse: true,
  },
];

const TYPE_MAP: Record<string, { name: string; desc: string }> = {
  INTJ: {
    name: "INTJ — Strategist",
    desc: "You think in systems, plan several steps ahead, and make decisions based on logic and long-term goals.",
  },
  INTP: {
    name: "INTP — Analyst",
    desc: "Curiosity drives you. You enjoy exploring ideas, building mental models, and finding clean explanations.",
  },
  ENTJ: {
    name: "ENTJ — Commander",
    desc: "You naturally organize people and resources. You prioritize fast, set direction, and execute to outcomes.",
  },
  ENTP: {
    name: "ENTP — Innovator",
    desc: "You love mental challenges and possibilities. You generate options quickly and test hypotheses in the real world.",
  },

  INFJ: {
    name: "INFJ — Counselor",
    desc: "You have strong intuition and deep awareness of people. You connect vision with values and meaning.",
  },
  INFP: {
    name: "INFP — Idealist",
    desc: "You're guided by authenticity and purpose. You notice emotional nuance and care about what feels true.",
  },
  ENFJ: {
    name: "ENFJ — Mentor",
    desc: "You read people well and help them grow. You build momentum through encouragement and clear direction.",
  },
  ENFP: {
    name: "ENFP — Visionary",
    desc: "You spark change with energy and imagination. You inspire others and enjoy exploring new paths.",
  },

  ISTJ: {
    name: "ISTJ — Executor",
    desc: "You value reliability, responsibility, and clear rules. You deliver steadily and handle details with care.",
  },
  ISFJ: {
    name: "ISFJ — Caregiver",
    desc: "You're attentive and supportive. You notice what people need and keep things stable and practical.",
  },
  ESTJ: {
    name: "ESTJ — Operator",
    desc: "You like clarity and structure. You set the rules of the game and lead others to concrete results.",
  },
  ESFJ: {
    name: "ESFJ — Connector",
    desc: "You build community and protect relationships. You bring people together and keep the atmosphere healthy.",
  },

  ISTP: {
    name: "ISTP — Tactician",
    desc: "You solve problems hands-on. You observe, analyze, and act efficiently—especially when things break.",
  },
  ISFP: {
    name: "ISFP — Artisan",
    desc: "You're sensitive to quality and experience. You prefer doing things your way, in alignment with how you feel.",
  },
  ESTP: {
    name: "ESTP — Challenger",
    desc: "You act fast and stay practical. You enjoy intensity, risk, and learning through action.",
  },
  ESFP: {
    name: "ESFP — Performer",
    desc: "You bring energy and lightness. You enjoy people, experiences, and spontaneous momentum.",
  },
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function scoreTo100(avg1to5: number) {
  return Math.round(clamp01((avg1to5 - 1) / 4) * 100);
}

export function computeResult(answers: number[]): StoredResultV1 {
  const byTrait: Record<Trait, number[]> = { E: [], O: [], C: [], A: [], N: [] };

  QUESTIONS.forEach((q, idx) => {
    const raw = answers[idx];
    const v = q.reverse ? 6 - raw : raw;
    byTrait[q.trait].push(v);
  });

  const scores: Record<Trait, number> = { E: 0, O: 0, C: 0, A: 0, N: 0 };

  (Object.keys(byTrait) as Trait[]).forEach((t) => {
    const arr = byTrait[t];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    scores[t] = scoreTo100(avg);
  });

  const stability = 100 - scores.N;

  const Eletter = scores.E >= 50 ? "E" : "I";
  const Nletter = scores.O >= 50 ? "N" : "S";
  const Fletter = scores.A >= 50 ? "F" : "T";
  const Jletter = scores.C >= 50 ? "J" : "P";
  const typeCode = `${Eletter}${Nletter}${Fletter}${Jletter}`;

  const type = TYPE_MAP[typeCode] ?? {
    name: `${typeCode}`,
    desc: "Description coming soon.",
  };

  const stressProfile =
    stability >= 67
      ? {
          label: "Emotionally steady",
          note: "You typically stay calm under pressure and recover quickly after setbacks.",
        }
      : stability >= 34
      ? {
          label: "Stress-sensitive",
          note: "You're naturally vigilant. Sleep, movement, and sensory breaks help you reset.",
        }
      : {
          label: "Highly reactive",
          note: "You feel stress strongly. A clear recovery routine and lowering overload helps a lot.",
        };

  const highO = scores.O >= 50;
  const highA = scores.A >= 50;
  const subtype =
    highO && highA
      ? {
          label: "Empathic Visionary",
          note: "Creativity plus people-awareness. You want solutions that are smart and human.",
        }
      : highO && !highA
      ? {
          label: "Independent Innovator",
          note: "Big ideas plus tough standards. You challenge assumptions and cut through noise.",
        }
      : !highO && highA
      ? {
          label: "Supportive Pragmatist",
          note: "Practical approach plus warmth. You stabilize situations and protect relationships.",
        }
      : {
          label: "Direct Realist",
          note: "Concrete thinking plus blunt honesty. You value results, clarity, and efficient action.",
        };

  const highC = scores.C >= 50;
  const highE = scores.E >= 50;
  const mode =
    highC && highE
      ? {
          label: "Drive & deliver",
          note: "You move quickly from talk to execution. You like pace and closing loops.",
        }
      : highC && !highE
      ? {
          label: "Plan & precision",
          note: "You prefer strong preparation, then steady execution with minimal noise.",
        }
      : !highC && highE
      ? {
          label: "Energy & improvise",
          note: "You learn while moving. Fast feedback and momentum are your fuel.",
        }
      : {
          label: "Adapt & observe",
          note: "You scan the field first, then choose the best move. Flexible structure suits you.",
        };

  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    answers,
    scores,
    stability,
    typeCode,
    typeName: type.name,
    typeDescription: type.desc,
    addOns: { stressProfile, subtype, mode },
  };
}
