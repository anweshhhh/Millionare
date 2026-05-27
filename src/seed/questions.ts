import type { Question } from "../domain/game.ts";

export const QUESTION_SET_VERSION = "seed-v1";

export const SEEDED_QUESTIONS: Question[] = [
  {
    id: "q-01",
    category: "Pattern Recall",
    prompt: "Which planet in our solar system is known for its prominent rings?",
    options: ["Mars", "Saturn", "Venus", "Mercury"],
    correctIndex: 1,
    difficultyBand: "easy",
    pressureTag: "calm"
  },
  {
    id: "q-02",
    category: "Language",
    prompt: "What is the collective noun most commonly used for a group of wolves?",
    options: ["Fleet", "Pack", "Swarm", "Nest"],
    correctIndex: 1,
    difficultyBand: "easy",
    pressureTag: "calm"
  },
  {
    id: "q-03",
    category: "World Facts",
    prompt: "Which city serves as the capital of Canada?",
    options: ["Toronto", "Montreal", "Ottawa", "Vancouver"],
    correctIndex: 2,
    difficultyBand: "easy",
    pressureTag: "neutral"
  },
  {
    id: "q-04",
    category: "Science",
    prompt: "Water boils at 100 degrees Celsius at what reference condition?",
    options: ["Sea level pressure", "Arctic conditions", "Desert heat", "Vacuum pressure"],
    correctIndex: 0,
    difficultyBand: "easy",
    pressureTag: "neutral"
  },
  {
    id: "q-05",
    category: "Literature",
    prompt: "Who wrote the novel '1984'?",
    options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "Mary Shelley"],
    correctIndex: 0,
    difficultyBand: "medium",
    pressureTag: "neutral"
  },
  {
    id: "q-06",
    category: "Math",
    prompt: "What is the value of 9 squared?",
    options: ["72", "81", "99", "108"],
    correctIndex: 1,
    difficultyBand: "medium",
    pressureTag: "calm"
  },
  {
    id: "q-07",
    category: "Art",
    prompt: "The Mona Lisa is displayed in which museum?",
    options: ["The Louvre", "The Met", "The Uffizi", "The Prado"],
    correctIndex: 0,
    difficultyBand: "medium",
    pressureTag: "neutral"
  },
  {
    id: "q-08",
    category: "Technology",
    prompt: "HTML stands for what?",
    options: [
      "Hyper Trainer Marking Language",
      "High Text Markdown Language",
      "HyperText Markup Language",
      "Home Tool Markup Logic"
    ],
    correctIndex: 2,
    difficultyBand: "medium",
    pressureTag: "spiky"
  },
  {
    id: "q-09",
    category: "History",
    prompt: "In which year did the Berlin Wall fall?",
    options: ["1985", "1987", "1989", "1991"],
    correctIndex: 2,
    difficultyBand: "hard",
    pressureTag: "spiky"
  },
  {
    id: "q-10",
    category: "Biology",
    prompt: "What gas do plants primarily absorb from the atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
    correctIndex: 2,
    difficultyBand: "hard",
    pressureTag: "neutral"
  },
  {
    id: "q-11",
    category: "Geography",
    prompt: "Which desert is the largest hot desert on Earth?",
    options: ["Gobi", "Kalahari", "Sahara", "Arabian"],
    correctIndex: 2,
    difficultyBand: "hard",
    pressureTag: "spiky"
  },
  {
    id: "q-12",
    category: "Music",
    prompt: "How many strings does a standard violin have?",
    options: ["Four", "Five", "Six", "Seven"],
    correctIndex: 0,
    difficultyBand: "medium",
    pressureTag: "calm"
  }
];

export const SEEDED_QUESTION_MAP = new Map(SEEDED_QUESTIONS.map((question) => [question.id, question]));

export function getSeededQuestionById(questionId: string) {
  return SEEDED_QUESTION_MAP.get(questionId) ?? null;
}
