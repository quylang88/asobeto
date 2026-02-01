import { LessonContent } from "../map-structure";

// Lesson content for Floor 1 (Chữ a)
export const floor1Lessons: LessonContent[] = [
  {
    id: "f1-l1",
    type: "passive",
    title: "Làm Quen Chữ A",
    mainAudio: "/assets/alphabet/a-female.mp3",
    instruction: "Bé hãy nghe và nhìn chữ A nhé!",
    pronunciation: "A",
  },
  {
    id: "f1-l2",
    type: "active",
    title: "Thử Tài",
    question: "Chữ A ở đâu nhỉ?",
    instruction: "Bé hãy chọn chữ A nhé",
    mainAudio: "/assets/alphabet/quiz-find-a.mp3",
    answers: [
      { id: "a", text: "A", isCorrect: true },
      { id: "b", text: "B", isCorrect: false },
      { id: "c", text: "C", isCorrect: false },
    ],
  },
  {
    id: "f1-l3",
    type: "active",
    title: "Nghe Tinh",
    question: "Âm này là của chữ nào?",
    instruction: "Bé nghe 'Bờ' là chữ nào?",
    mainAudio: "/assets/alphabet/sound-b.mp3",
    answers: [
      { id: "d", text: "D", isCorrect: false },
      { id: "b", text: "B", isCorrect: true },
      { id: "p", text: "P", isCorrect: false },
    ],
  },
  {
    id: "f1-l4",
    type: "active",
    title: "Ôn Tập",
    question: "Tìm lại chữ A nào!",
    instruction: "Bé chọn lại chữ A nhé",
    answers: [
      { id: "c", text: "C", isCorrect: false },
      { id: "g", text: "G", isCorrect: false },
      { id: "a", text: "A", isCorrect: true },
    ],
  },
];
