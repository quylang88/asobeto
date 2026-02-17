import { AUDIO, AUDIO_TEMPLATES } from "./catalog";

interface AudioStaticMetadata {
  src: string;
  purpose: string;
  usedBy: readonly string[];
}

interface AudioTemplateMetadata {
  template: string;
  placeholders: readonly string[];
  purpose: string;
  usedBy: readonly string[];
}

export const AUDIO_CATALOG_METADATA = {
  static: {
    feedbackSuccessAnswer: {
      src: AUDIO.FEEDBACK.SUCCESS_ANSWER,
      purpose: "Âm thanh phản hồi khi trả lời đúng hoặc đạt tiến độ.",
      usedBy: [
        "src/components/celebrations/star-celebration.tsx",
        "src/screens/lesson-interface/constants.ts",
        "src/screens/game-animal-feed/index.tsx",
        "src/screens/game-diacritic-build/index.tsx",
      ],
    },
    feedbackWrongAnswer: {
      src: AUDIO.FEEDBACK.WRONG_ANSWER,
      purpose: "Âm thanh phản hồi khi trả lời sai hoặc mất mạng.",
      usedBy: [
        "src/components/celebrations/broken-heart-celebration.tsx",
        "src/screens/lesson-interface/constants.ts",
        "src/screens/game-animal-feed/index.tsx",
        "src/screens/game-bubble-pop.tsx",
        "src/screens/game-diacritic-build/index.tsx",
      ],
    },
    feedbackTryAgain: {
      src: AUDIO.FEEDBACK.TRY_AGAIN,
      purpose: "Âm thanh màn hình tổng kết khi chưa đạt sao.",
      usedBy: ["src/components/completion/lesson-completion-view.tsx"],
    },
    feedbackApplauseCheering: {
      src: AUDIO.FEEDBACK.APPLAUSE_CHEERING,
      purpose: "Âm thanh màn hình tổng kết khi hoàn thành tốt.",
      usedBy: ["src/components/completion/lesson-completion-view.tsx"],
    },
    gameCommonPop: {
      src: AUDIO.GAME.COMMON.POP,
      purpose: "Hiệu ứng pop dùng chung cho tương tác mini game.",
      usedBy: [
        "src/screens/game-animal-feed/index.tsx",
        "src/screens/game-bubble-pop.tsx",
        "src/screens/game-diacritic-build/index.tsx",
      ],
    },
    animalFeedEatingGrass: {
      src: AUDIO.GAME.ANIMAL_FEED.EATING_GRASS,
      purpose: "Âm thanh bò ăn cỏ trong mini game Animal Feed.",
      usedBy: ["src/screens/game-animal-feed/index.tsx"],
    },
    bubblePopIntro: {
      src: AUDIO.GAME.BUBBLE_POP.INTRO,
      purpose: "Narration mở đầu ở màn chọn level Bubble Pop.",
      usedBy: ["src/data/mini-games/bubble-pop.ts"],
    },
    bubblePopTargetA: {
      src: AUDIO.GAME.BUBBLE_POP.TARGET_BY_LETTER.a,
      purpose: "Âm đọc chữ mục tiêu 'a' cho Bubble Pop.",
      usedBy: ["src/data/world-1-alphabet/tower-1/floor-4.ts"],
    },
    bubblePopTargetC: {
      src: AUDIO.GAME.BUBBLE_POP.TARGET_BY_LETTER.c,
      purpose: "Âm đọc chữ mục tiêu 'c' cho Bubble Pop.",
      usedBy: ["src/data/world-1-alphabet/tower-1/floor-4.ts"],
    },
    memoryFlipWhoosh: {
      src: AUDIO.GAME.MEMORY_FLIP.FLIP,
      purpose: "Âm khi lật thẻ trong mini game Memory Flip.",
      usedBy: ["src/data/mini-games/memory-flip.ts"],
    },
    memoryFlipDingCorrect: {
      src: AUDIO.GAME.MEMORY_FLIP.MATCH,
      purpose: "Âm khi ghép đúng cặp trong mini game Memory Flip.",
      usedBy: ["src/data/mini-games/memory-flip.ts"],
    },
    memoryFlipWrongBop: {
      src: AUDIO.GAME.MEMORY_FLIP.MISMATCH,
      purpose: "Âm khi ghép sai cặp trong mini game Memory Flip.",
      usedBy: ["src/data/mini-games/memory-flip.ts"],
    },
  },
  templates: {
    letterMain: {
      template: AUDIO_TEMPLATES.LETTER_MAIN,
      placeholders: ["letterAssetKey"],
      purpose: "Âm đọc chữ cái chính theo mã asset.",
      usedBy: ["src/data/lesson-templates/letter/shared.ts"],
    },
    letterIntroVariant: {
      template: AUDIO_TEMPLATES.LETTER_INTRO_VARIANT,
      placeholders: ["lessonSlug", "variant"],
      purpose: "Âm intro chữ cái theo lesson và variant.",
      usedBy: ["src/data/lesson-templates/letter/shared.ts"],
    },
    vocabMain: {
      template: AUDIO_TEMPLATES.VOCAB_MAIN,
      placeholders: ["wordAssetKey"],
      purpose: "Âm đọc từ vựng chính theo mã asset.",
      usedBy: [
        "src/data/lesson-templates/vocab/shared.ts",
        "src/data/world-1-alphabet/tower-boss-1/floor-1.ts",
      ],
    },
    vocabIntroVariant: {
      template: AUDIO_TEMPLATES.VOCAB_INTRO_VARIANT,
      placeholders: ["lessonSlug", "variant"],
      purpose: "Âm intro từ vựng theo lesson và variant.",
      usedBy: ["src/data/lesson-templates/vocab/shared.ts"],
    },
    vocabSpelling: {
      template: AUDIO_TEMPLATES.VOCAB_SPELLING,
      placeholders: ["wordAssetKey"],
      purpose: "Âm đánh vần của từ vựng theo mã asset.",
      usedBy: ["src/data/lesson-templates/vocab/shared.ts"],
    },
  },
} as const satisfies {
  static: Record<string, AudioStaticMetadata>;
  templates: Record<string, AudioTemplateMetadata>;
};
