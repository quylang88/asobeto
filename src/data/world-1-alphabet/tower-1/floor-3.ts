import { LessonContent } from "../map-structure";

// Lesson content for Floor 3 (Chữ â)
export const floor3Lessons: LessonContent[] = [
  {
    id: "f3-l1",
    type: "active",
    title: "Chữ Â",
    instruction: "Nghe và tìm chữ Â nhé!",
    pronunciation: "Ah",
    question: "Chữ Â ở đâu?",
    answers: [
      { id: "1", text: "Ă", isCorrect: false },
      { id: "2", text: "Â", isCorrect: true },
      { id: "3", text: "A", isCorrect: false }
    ]
  },
  {
    id: "f3-l2",
    type: "active",
    title: "Nghe Tinh",
    instruction: "Chữ cái nào có âm này nhỉ?",
    pronunciation: "Buh",
    question: "Nghe âm thanh và chọn",
    answers: [
      { id: "1", text: "D", isCorrect: false },
      { id: "2", text: "B", isCorrect: true },
      { id: "3", text: "P", isCorrect: false }
    ]
  },
  {
    id: "f3-l3",
    type: "active",
    title: "Chọn Chữ",
    instruction: "Chọn chữ cái đúng nhé!",
    pronunciation: "Kuh",
    question: "Chữ C ở đâu?",
    answers: [
      { id: "1", text: "C", isCorrect: true },
      { id: "2", text: "G", isCorrect: false },
      { id: "3", text: "K", isCorrect: false }
    ]
  },
  {
    id: "f3-l4",
    type: "active",
    title: "Ôn Tập",
    instruction: "Nghe và tìm chữ Â nhé! (Lần 2)",
    pronunciation: "Ah",
    question: "Tìm lại chữ Â nào",
    answers: [
      { id: "1", text: "Ă", isCorrect: false },
      { id: "2", text: "Â", isCorrect: true },
      { id: "3", text: "A", isCorrect: false }
    ]
  },
];
