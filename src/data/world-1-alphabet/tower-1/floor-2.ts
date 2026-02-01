import { LessonContent } from "../map-structure";

// Lesson content for Floor 2 (Chữ ă)
export const floor2Lessons: LessonContent[] = [
  {
    id: "f2-l1",
    type: "active",
    title: "Chữ Ă",
    instruction: "Nghe và tìm chữ Ă nhé!",
    pronunciation: "Ah",
    question: "Chữ Ă đâu rồi?",
    answers: [
      { id: "1", text: "Ă", isCorrect: true },
      { id: "2", text: "Â", isCorrect: false },
      { id: "3", text: "A", isCorrect: false },
    ],
  },
  {
    id: "f2-l2",
    type: "active",
    title: "Nghe Tinh",
    instruction: "Chữ cái nào có âm này nhỉ?",
    pronunciation: "Buh",
    question: "Nghe âm thanh và chọn",
    answers: [
      { id: "1", text: "D", isCorrect: false },
      { id: "2", text: "B", isCorrect: true },
      { id: "3", text: "P", isCorrect: false },
    ],
  },
  {
    id: "f2-l3",
    type: "active",
    title: "Chọn Chữ",
    instruction: "Chọn chữ cái đúng nhé!",
    pronunciation: "Kuh",
    question: "Chữ C ở đâu?",
    answers: [
      { id: "1", text: "C", isCorrect: true },
      { id: "2", text: "G", isCorrect: false },
      { id: "3", text: "K", isCorrect: false },
    ],
  },
  {
    id: "f2-l4",
    type: "active",
    title: "Ôn Tập",
    instruction: "Nghe và tìm chữ Ă nhé! (Lần 2)",
    pronunciation: "Ah",
    question: "Tìm chữ Ă nào",
    answers: [
      { id: "1", text: "Ă", isCorrect: true },
      { id: "2", text: "Â", isCorrect: false },
      { id: "3", text: "A", isCorrect: false },
    ],
  },
];
