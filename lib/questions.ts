export type Trait = "O" | "C" | "E" | "A" | "S";

export type Question = {
  id: number;
  trait: Trait;
  text: string;
};

export const QUESTIONS: Question[] = [
  // O - Openness
  { id: 1, trait: "O", text: "I enjoy exploring new ideas and ways of thinking." },
  { id: 2, trait: "O", text: "I am often interested in art, culture, or philosophy." },
  { id: 3, trait: "O", text: "Routine, repetitive tasks bore me easily." },
  { id: 4, trait: "O", text: "I value creativity more than tried-and-true patterns." },
  { id: 5, trait: "O", text: "I like experimenting with new solutions." },

  // C - Conscientiousness
  { id: 6, trait: "C", text: "I usually plan my actions in advance." },
  { id: 7, trait: "C", text: "I try to see tasks through to the end." },
  { id: 8, trait: "C", text: "Punctuality is very important to me." },
  { id: 9, trait: "C", text: "I feel good when I have clearly defined goals." },
  { id: 10, trait: "C", text: "I rarely act chaotically or impulsively." },

  // E - Extraversion
  { id: 11, trait: "E", text: "I easily start conversations with new people." },
  { id: 12, trait: "E", text: "I feel comfortable in the center of attention." },
  { id: 13, trait: "E", text: "Social gatherings give me energy." },
  { id: 14, trait: "E", text: "I prefer working in a group rather than alone." },
  { id: 15, trait: "E", text: "I often take the initiative in conversations." },

  // A - Agreeableness
  { id: 16, trait: "A", text: "I try to avoid conflicts." },
  { id: 17, trait: "A", text: "I easily show empathy to others." },
  { id: 18, trait: "A", text: "I often put others' needs before my own." },
  { id: 19, trait: "A", text: "People see me as a kind person." },
  { id: 20, trait: "A", text: "Cooperation matters more to me than competition." },

  // S - Emotional stability
  { id: 21, trait: "S", text: "I rarely feel strong stress without a clear reason." },
  { id: 22, trait: "S", text: "I handle pressure well." },
  { id: 23, trait: "S", text: "Difficult situations do not easily throw me off balance." },
  { id: 24, trait: "S", text: "I rarely worry about things I cannot control." },
  { id: 25, trait: "S", text: "I usually feel emotionally stable." },
];

export const TRAIT_LABELS: Record<Trait, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  S: "Emotional stability",
};

export const TRAIT_BY_QID: Record<number, Trait> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q.trait])
) as Record<number, Trait>;
