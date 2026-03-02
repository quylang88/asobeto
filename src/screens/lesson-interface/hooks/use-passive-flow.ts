"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
} from "react";

interface UsePassiveFlowParams {
  clearAdvanceTimeout: () => void;
  currentStep: number;
  requiresAnimationComplete: boolean;
  isLetterTraceDemoLesson: boolean;
  canFastForwardTraceDemo: boolean;
  passiveReady: boolean;
  traceDemoFastForwarded: boolean;
  setPassiveReady: Dispatch<SetStateAction<boolean>>;
  setTraceDemoFastForwarded: Dispatch<SetStateAction<boolean>>;
  setTraceDemoReplayKey: Dispatch<SetStateAction<number>>;
}

export function usePassiveFlow({
  clearAdvanceTimeout,
  currentStep,
  requiresAnimationComplete,
  isLetterTraceDemoLesson,
  canFastForwardTraceDemo,
  passiveReady,
  traceDemoFastForwarded,
  setPassiveReady,
  setTraceDemoFastForwarded,
  setTraceDemoReplayKey,
}: UsePassiveFlowParams) {
  const handleTraceDemoComplete = useCallback(() => {
    setPassiveReady(true);
  }, [setPassiveReady]);

  const handleReplayTraceDemo = useCallback(() => {
    clearAdvanceTimeout();
    setPassiveReady(false);
    setTraceDemoFastForwarded(false);
    setTraceDemoReplayKey((prev) => prev + 1);
  }, [
    clearAdvanceTimeout,
    setPassiveReady,
    setTraceDemoFastForwarded,
    setTraceDemoReplayKey,
  ]);

  const handleFastForwardTraceDemo = useCallback(() => {
    if (!canFastForwardTraceDemo || passiveReady || traceDemoFastForwarded) {
      return;
    }

    clearAdvanceTimeout();
    setTraceDemoFastForwarded(true);
    setPassiveReady(true);
  }, [
    canFastForwardTraceDemo,
    clearAdvanceTimeout,
    passiveReady,
    setPassiveReady,
    setTraceDemoFastForwarded,
    traceDemoFastForwarded,
  ]);

  useEffect(() => {
    if (!requiresAnimationComplete || passiveReady || isLetterTraceDemoLesson) {
      return;
    }

    // Auto-mở nút tiếp tục sau animation passive để giữ flow mượt cho bé.
    const timeoutId = window.setTimeout(() => {
      setPassiveReady(true);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    requiresAnimationComplete,
    passiveReady,
    currentStep,
    isLetterTraceDemoLesson,
    setPassiveReady,
  ]);

  return {
    handleTraceDemoComplete,
    handleReplayTraceDemo,
    handleFastForwardTraceDemo,
  };
}
