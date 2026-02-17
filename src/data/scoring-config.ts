import type {
  LessonContent,
  LessonScoring,
  LessonScoringProgressMode,
  ScoringMetric,
} from "./world-1-alphabet";

type ThresholdScoringMetric = Extract<
  ScoringMetric,
  "trace_accuracy" | "speech_similarity"
>;

interface ThresholdScoringDefaults {
  passPolicy: "always" | "threshold";
  passThreshold: number;
  oneStarThreshold: number;
  twoStarThreshold: number;
  maxStars: number;
  progressMode: LessonScoringProgressMode;
}

export interface ResolvedLessonScoring {
  metric: ScoringMetric;
  passPolicy: "always" | "threshold";
  passThreshold: number;
  oneStarThreshold: number;
  twoStarThreshold: number;
  maxStars: number;
  progressMode: LessonScoringProgressMode;
}

export interface LessonScoreEvaluation {
  isPassed: boolean;
  earnedStars: number;
}

export const LESSON_ONE_STAR_THRESHOLD = 0.5;
export const LESSON_TWO_STAR_THRESHOLD = 0.85;
export const LESSON_PASS_THRESHOLD = LESSON_ONE_STAR_THRESHOLD;
export const BOSS_REVIEW_PASS_THRESHOLD = 0.7;

const THRESHOLD_SCORING_DEFAULTS_BY_METRIC: Record<
  ThresholdScoringMetric,
  ThresholdScoringDefaults
> = {
  trace_accuracy: {
    passPolicy: "threshold",
    passThreshold: LESSON_PASS_THRESHOLD,
    oneStarThreshold: LESSON_ONE_STAR_THRESHOLD,
    twoStarThreshold: LESSON_TWO_STAR_THRESHOLD,
    maxStars: 2,
    progressMode: "stars",
  },
  speech_similarity: {
    passPolicy: "threshold",
    passThreshold: LESSON_PASS_THRESHOLD,
    oneStarThreshold: LESSON_ONE_STAR_THRESHOLD,
    twoStarThreshold: LESSON_TWO_STAR_THRESHOLD,
    maxStars: 2,
    progressMode: "stars",
  },
};

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function resolveThresholdMetric(metric: ScoringMetric): ThresholdScoringMetric {
  if (metric === "speech_similarity") return metric;
  return "trace_accuracy";
}

function resolveDefaultsByMetric(metric: ScoringMetric): ThresholdScoringDefaults {
  const thresholdMetric = resolveThresholdMetric(metric);
  return THRESHOLD_SCORING_DEFAULTS_BY_METRIC[thresholdMetric];
}

export function createLessonScoring(
  metric: ThresholdScoringMetric,
  overrides: Partial<Omit<LessonScoring, "metric">> = {},
): LessonScoring {
  const defaults = THRESHOLD_SCORING_DEFAULTS_BY_METRIC[metric];
  const passPolicy = overrides.passPolicy ?? defaults.passPolicy;
  const oneStarThreshold = clamp01(
    overrides.starThresholds?.oneStar ?? defaults.oneStarThreshold,
  );
  const twoStarThreshold = clamp01(
    Math.max(
      oneStarThreshold,
      overrides.starThresholds?.twoStars ?? defaults.twoStarThreshold,
    ),
  );
  const passThreshold =
    passPolicy === "threshold"
      ? clamp01(overrides.passThreshold ?? defaults.passThreshold)
      : undefined;

  return {
    metric,
    passPolicy,
    passThreshold,
    starThresholds: {
      oneStar: oneStarThreshold,
      twoStars: twoStarThreshold,
    },
    maxStars: Math.max(0, Math.round(overrides.maxStars ?? defaults.maxStars)),
    progressMode: overrides.progressMode ?? defaults.progressMode,
  };
}

export function resolveLessonScoring(
  lesson: LessonContent | undefined,
  fallbackMetric: ThresholdScoringMetric,
): ResolvedLessonScoring {
  const scoring =
    lesson?.type === "active" ? lesson.scoring : undefined;
  const metric = scoring?.metric ?? fallbackMetric;
  const defaults = resolveDefaultsByMetric(metric);

  const passPolicy = scoring?.passPolicy ?? defaults.passPolicy;
  const oneStarThreshold = clamp01(
    scoring?.starThresholds?.oneStar ?? defaults.oneStarThreshold,
  );
  const twoStarThreshold = clamp01(
    Math.max(
      oneStarThreshold,
      scoring?.starThresholds?.twoStars ?? defaults.twoStarThreshold,
    ),
  );
  const progressMode = scoring?.progressMode ?? defaults.progressMode;
  const configuredMaxStars = Math.max(
    0,
    Math.round(scoring?.maxStars ?? defaults.maxStars),
  );

  return {
    metric,
    passPolicy,
    passThreshold:
      passPolicy === "threshold"
        ? clamp01(scoring?.passThreshold ?? defaults.passThreshold)
        : 0,
    oneStarThreshold,
    twoStarThreshold,
    maxStars: progressMode === "pass_count" ? 0 : configuredMaxStars,
    progressMode,
  };
}

export function evaluateLessonScore(
  score: number,
  scoring: ResolvedLessonScoring,
): LessonScoreEvaluation {
  const normalizedScore = clamp01(score);
  let earnedStars = 0;

  if (normalizedScore >= scoring.twoStarThreshold) {
    earnedStars = 2;
  } else if (normalizedScore >= scoring.oneStarThreshold) {
    earnedStars = 1;
  }

  return {
    earnedStars: Math.min(scoring.maxStars, earnedStars),
    isPassed:
      scoring.passPolicy === "always"
        ? true
        : normalizedScore >= scoring.passThreshold,
  };
}
