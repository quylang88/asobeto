import { LessonContent } from "../map-structure";

// Placeholder content for now, can be customized per floor
const standardContent: LessonContent[] = [
  {
    type: "listen",
    letter: "A",
    pronunciation: "Ah",
    instruction: "Nghe và nhắc lại nào!",
    options: ["A", "B", "C"],
    correct: "A",
  },
  {
    type: "listen",
    letter: "B",
    pronunciation: "Buh",
    instruction: "Chữ cái nào có âm này nhỉ?",
    options: ["D", "B", "P"],
    correct: "B",
  },
  {
    type: "listen",
    letter: "C",
    pronunciation: "Kuh",
    instruction: "Chọn chữ cái đúng nhé!",
    options: ["C", "G", "K"],
    correct: "C",
  },
  {
    type: "listen",
    letter: "A",
    pronunciation: "Ah",
    instruction: "Nghe và nhắc lại nào! (Lần 2)",
    options: ["A", "B", "C"],
    correct: "A",
  },
];

export const floor1Lessons: LessonContent[] = standardContent;

// Currently reusing standard content, but separated for future customization
export const floor2Lessons: LessonContent[] = [...standardContent];

export const floor3Lessons: LessonContent[] = [...standardContent];

export const floor4Lessons: LessonContent[] = [
  ...standardContent,
  ...standardContent,
  {
    type: "listen",
    letter: "B",
    pronunciation: "Buh",
    instruction: "BOSS: Chữ cái nào có âm này nhỉ?",
    options: ["D", "B", "P"],
    correct: "B",
  },
  {
    type: "listen",
    letter: "C",
    pronunciation: "Kuh",
    instruction: "BOSS: Chọn chữ cái đúng nhé!",
    options: ["C", "G", "K"],
    correct: "C",
  },
];
