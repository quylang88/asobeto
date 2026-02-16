import type { LessonContent } from "@/data/game-config";

// Ngưỡng điểm số mặc định cho toàn bộ ứng dụng (Tracing & Pronunciation)
export const DEFAULT_ONE_STAR_THRESHOLD = 0.5;
export const DEFAULT_TWO_STAR_THRESHOLD = 0.85; // Thống nhất 0.85 cho cả 2 loại bài học
export const BOSS_PASS_THRESHOLD = 0.7; // Ngưỡng qua màn cho boss (không tính sao)
export const DEFAULT_MAX_STARS = 2;

export interface ScoringConfig {
  passThreshold: number;
  oneStarThreshold: number;
  twoStarThreshold: number;
  maxStars: number;
}

/**
 * Lấy cấu hình chấm điểm dựa trên bài học và ngữ cảnh (có phải boss không).
 * Hàm này tập trung logic chấm điểm về một chỗ để dễ quản lý.
 */
export function getScoringConfig(
  lesson: LessonContent | undefined,
  isBossTower: boolean,
): ScoringConfig {
  // Nếu là màn Boss, áp dụng luật cứng: Cần 0.7 để qua màn, không tính sao (maxStars = 0).
  if (isBossTower) {
    return {
      passThreshold: BOSS_PASS_THRESHOLD,
      oneStarThreshold: 1.0, // Đặt cao để không bao giờ đạt (dù maxStars đã chặn rồi)
      twoStarThreshold: 1.0,
      maxStars: 0,
    };
  }

  // Nếu không có lesson (trường hợp hiếm/lỗi), trả về mặc định
  if (!lesson) {
    return {
      passThreshold: DEFAULT_ONE_STAR_THRESHOLD,
      oneStarThreshold: DEFAULT_ONE_STAR_THRESHOLD,
      twoStarThreshold: DEFAULT_TWO_STAR_THRESHOLD,
      maxStars: DEFAULT_MAX_STARS,
    };
  }

  // Lấy cấu hình từ lesson hoặc dùng mặc định
  const oneStar = lesson.scoring?.starThresholds?.oneStar ?? DEFAULT_ONE_STAR_THRESHOLD;
  const twoStars = lesson.scoring?.starThresholds?.twoStars ?? DEFAULT_TWO_STAR_THRESHOLD;

  // Mặc định passThreshold bằng oneStarThreshold nếu không quy định riêng
  const pass = lesson.scoring?.passThreshold ?? oneStar;

  const maxStars = lesson.scoring?.maxStars ?? DEFAULT_MAX_STARS;

  return {
    passThreshold: clamp01(pass),
    oneStarThreshold: clamp01(oneStar),
    twoStarThreshold: clamp01(twoStars),
    maxStars: Math.max(0, maxStars),
  };
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
