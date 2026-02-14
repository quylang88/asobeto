import { LessonContent } from "../map-structure";
import { createMemoryFlipChallengeLesson } from "../../lesson-templates/challenges";

export const floor4Lessons: LessonContent[] = [
  createMemoryFlipChallengeLesson({
    lessonId: "t5-f4-memory-flip",
    title: "Chọn mức độ",
    headerTitle: "Trí nhớ",
    instruction: "Lật thẻ giống nhau để xóa hết các cặp.",
    rules: [
      "Mỗi lượt bé lật 2 thẻ.",
      "Giống nhau thì thẻ biến mất.",
      "Khác nhau thì thẻ tự úp lại sau một chút.",
    ],
    levelTokenPools: {
      easy: [
        { id: "m", text: "m", kind: "letter" },
        { id: "e", text: "e", kind: "letter" },
        { id: "b", text: "b", kind: "letter" },
        { id: "o-mu", text: "ô", kind: "letter" },
      ],
      normal: [
        { id: "m", text: "m", kind: "letter" },
        { id: "e", text: "e", kind: "letter" },
        { id: "b", text: "b", kind: "letter" },
        { id: "o-mu", text: "ô", kind: "letter" },
        { id: "c", text: "c", kind: "letter" },
        { id: "a", text: "a", kind: "letter" },
      ],
      hard: [
        { id: "m", text: "m", kind: "letter" },
        { id: "e", text: "e", kind: "letter" },
        { id: "b", text: "b", kind: "letter" },
        { id: "o-mu", text: "ô", kind: "letter" },
        { id: "c", text: "c", kind: "letter" },
        { id: "a", text: "a", kind: "letter" },
        { id: "bo-word", text: "bố", kind: "word" },
        { id: "me-word", text: "mẹ", kind: "word" },
      ],
    },
  }),
];
