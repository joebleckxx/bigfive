export type Trait = "O" | "C" | "E" | "A" | "S";

export type Question = {
  id: number;
  trait: Trait;
  text: string;
};

export const QUESTIONS: Question[] = [
  // O - Otwartość
  { id: 1, trait: "O", text: "Lubię poznawać nowe idee i sposoby myślenia." },
  { id: 2, trait: "O", text: "Często interesuję się sztuką, kulturą lub filozofią." },
  { id: 3, trait: "O", text: "Łatwo nudzą mnie rutynowe, powtarzalne zadania." },
  { id: 4, trait: "O", text: "Cenię kreatywność bardziej niż sprawdzone schematy." },
  { id: 5, trait: "O", text: "Chętnie eksperymentuję z nowymi rozwiązaniami." },

  // C - Sumienność
  { id: 6, trait: "C", text: "Zwykle planuję swoje działania z wyprzedzeniem." },
  { id: 7, trait: "C", text: "Staram się doprowadzać sprawy do końca." },
  { id: 8, trait: "C", text: "Punktualność jest dla mnie bardzo ważna." },
  { id: 9, trait: "C", text: "Dobrze czuję się, gdy mam jasno określone cele." },
  { id: 10, trait: "C", text: "Rzadko działam chaotycznie lub impulsywnie." },

  // E - Ekstrawersja
  { id: 11, trait: "E", text: "Łatwo nawiązuję rozmowy z nowymi ludźmi." },
  { id: 12, trait: "E", text: "Dobrze czuję się w centrum uwagi." },
  { id: 13, trait: "E", text: "Spotkania towarzyskie dodają mi energii." },
  { id: 14, trait: "E", text: "Lubię działać w grupie bardziej niż samodzielnie." },
  { id: 15, trait: "E", text: "Często przejmuję inicjatywę w rozmowach." },

  // A - Ugodowość
  { id: 16, trait: "A", text: "Staram się unikać konfliktów." },
  { id: 17, trait: "A", text: "Łatwo okazuję empatię innym." },
  { id: 18, trait: "A", text: "Często stawiam potrzeby innych ponad swoje." },
  { id: 19, trait: "A", text: "Ludzie postrzegają mnie jako osobę życzliwą." },
  { id: 20, trait: "A", text: "Współpraca jest dla mnie ważniejsza niż rywalizacja." },

  // S - Stabilność emocjonalna
  { id: 21, trait: "S", text: "Rzadko odczuwam silny stres bez wyraźnego powodu." },
  { id: 22, trait: "S", text: "Dobrze radzę sobie z presją." },
  { id: 23, trait: "S", text: "Trudne sytuacje nie wytrącają mnie łatwo z równowagi." },
  { id: 24, trait: "S", text: "Rzadko martwię się rzeczami, na które nie mam wpływu." },
  { id: 25, trait: "S", text: "Zazwyczaj czuję się emocjonalnie stabilnie." },
];

export const TRAIT_LABELS: Record<Trait, string> = {
  O: "Otwartość",
  C: "Sumienność",
  E: "Ekstrawersja",
  A: "Ugodowość",
  S: "Stabilność emocjonalna",
};

export const TRAIT_BY_QID: Record<number, Trait> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q.trait])
) as Record<number, Trait>;
