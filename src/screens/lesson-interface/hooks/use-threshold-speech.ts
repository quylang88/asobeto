"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonContent } from "@/data/game-config";
import { FEEDBACK_ADVANCE_DELAY_MS } from "../constants";
import {
  type SpeechRecognitionErrorEventLike,
  type SpeechRecognitionLike,
  type SpeechRecognitionResultEventLike,
  type SpeechRecognitionWindow,
} from "../types";
import {
  evaluatePronunciationAttempt,
  getPronunciationScoringThresholds,
} from "../scoring/pronunciation-scoring";

interface UseThresholdSpeechParams {
  currentLesson: LessonContent | undefined;
  isThresholdSpeechLesson: boolean;
  isCorrect: boolean | null;
  targetText: string;
  clearAdvanceTimeout: () => void;
  onScoringResult: (
    correct: boolean,
    advanceDelayMs?: number,
    earnedStars?: number,
  ) => void;
  stopAudio: () => void;
}

export function useThresholdSpeech({
  currentLesson,
  isThresholdSpeechLesson,
  isCorrect,
  targetText,
  clearAdvanceTimeout,
  onScoringResult,
  stopAudio,
}: UseThresholdSpeechParams) {
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [isMicSubmitting, setIsMicSubmitting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechFinalizeRef = useRef(false);
  const speechTranscriptRef = useRef("");
  const accumulatedTranscriptRef = useRef("");
  const isManualStopRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micFrameRef = useRef<number | null>(null);

  const stopMicLevelCapture = useCallback(() => {
    if (micFrameRef.current !== null) {
      window.cancelAnimationFrame(micFrameRef.current);
      micFrameRef.current = null;
    }
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close().catch(() => undefined);
      micAudioContextRef.current = null;
    }
    micAnalyserRef.current = null;
    if (micStreamRef.current) {
      for (const track of micStreamRef.current.getTracks()) {
        track.stop();
      }
      micStreamRef.current = null;
    }
    setMicLevel(0);
  }, []);

  const stopSpeechRecognition = useCallback((abort: boolean) => {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    if (abort) {
      recognition.abort();
    } else {
      recognition.stop();
    }
    speechRecognitionRef.current = null;
  }, []);

  const resetSpeechSession = useCallback(() => {
    speechFinalizeRef.current = false;
    speechTranscriptRef.current = "";
    accumulatedTranscriptRef.current = "";
    isManualStopRef.current = false;
    stopSpeechRecognition(true);
    stopMicLevelCapture();
    setIsMicRecording(false);
    setIsMicSubmitting(false);
  }, [stopMicLevelCapture, stopSpeechRecognition]);

  const finalizeSpeechAttempt = useCallback(
    (capturedTranscript: string) => {
      if (
        !currentLesson ||
        currentLesson.type !== "active" ||
        !isThresholdSpeechLesson
      ) {
        return;
      }
      if (speechFinalizeRef.current) return;
      speechFinalizeRef.current = true;

      const transcript = capturedTranscript.trim();
      setIsMicRecording(false);
      setIsMicSubmitting(false);
      stopSpeechRecognition(true);
      stopMicLevelCapture();

      const thresholds = getPronunciationScoringThresholds(currentLesson);
      const result = evaluatePronunciationAttempt(
        transcript,
        targetText,
        thresholds,
      );

      onScoringResult(
        result.isPassed,
        FEEDBACK_ADVANCE_DELAY_MS,
        result.earnedStars,
      );
    },
    [
      currentLesson,
      isThresholdSpeechLesson,
      onScoringResult,
      stopMicLevelCapture,
      stopSpeechRecognition,
      targetText,
    ],
  );

  const startSpeechCapture = useCallback(async () => {
    if (
      !currentLesson ||
      currentLesson.type !== "active" ||
      !isThresholdSpeechLesson ||
      isCorrect !== null ||
      isMicRecording ||
      isMicSubmitting
    ) {
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const RecognitionCtor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    stopAudio(); // Đảm bảo âm thanh bài học dừng ngay lập tức
    clearAdvanceTimeout();
    speechTranscriptRef.current = "";
    accumulatedTranscriptRef.current = "";
    speechFinalizeRef.current = false;
    isManualStopRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        micAudioContextRef.current = audioContext;
        micAnalyserRef.current = analyser;

        const pcmBuffer = new Uint8Array(analyser.fftSize);
        const tick = () => {
          const activeAnalyser = micAnalyserRef.current;
          if (!activeAnalyser) return;
          activeAnalyser.getByteTimeDomainData(pcmBuffer);
          let sumSquares = 0;
          for (let i = 0; i < pcmBuffer.length; i += 1) {
            const normalizedSample = (pcmBuffer[i] - 128) / 128;
            sumSquares += normalizedSample * normalizedSample;
          }
          const rms = Math.sqrt(sumSquares / pcmBuffer.length);
          setMicLevel(Math.min(1, rms * 8));
          micFrameRef.current = window.requestAnimationFrame(tick);
        };
        tick();
      }

      const recognition = new RecognitionCtor();
      speechRecognitionRef.current = recognition;

      recognition.lang = "vi-VN";
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
        const segments: string[] = [];
        for (let i = 0; i < event.results.length; i += 1) {
          const transcript = event.results[i]?.[0]?.transcript;
          if (typeof transcript === "string" && transcript.trim()) {
            segments.push(transcript.trim());
          }
        }
        const mergedTranscript = segments.join(" ").trim();
        speechTranscriptRef.current = mergedTranscript;
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const errorCode =
          typeof event?.error === "string" ? event.error : "unknown";
        console.log("Speech recognition error:", errorCode);
      };

      recognition.onend = () => {
        if (isManualStopRef.current) {
          const fullTranscript = [
            accumulatedTranscriptRef.current,
            speechTranscriptRef.current,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
          finalizeSpeechAttempt(fullTranscript);
        } else {
          // Tự động khởi động lại nếu không dừng thủ công
          accumulatedTranscriptRef.current = [
            accumulatedTranscriptRef.current,
            speechTranscriptRef.current,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
          speechTranscriptRef.current = "";

          try {
            recognition.start();
          } catch (error) {
            console.log("Failed to restart speech recognition:", error);
            // Nếu khởi động lại thất bại, coi như kết thúc để tránh bị treo
            finalizeSpeechAttempt(accumulatedTranscriptRef.current);
          }
        }
      };

      setIsMicRecording(true);
      recognition.start();
    } catch (error) {
      console.log("Microphone start failed:", error);
      stopMicLevelCapture();
      setIsMicRecording(false);
      setIsMicSubmitting(false);
    }
  }, [
    clearAdvanceTimeout,
    currentLesson,
    finalizeSpeechAttempt,
    isCorrect,
    isMicRecording,
    isMicSubmitting,
    isThresholdSpeechLesson,
    stopAudio,
    stopMicLevelCapture,
  ]);

  const submitSpeechCapture = useCallback(() => {
    if (!isMicRecording || isMicSubmitting) return;

    // Đánh dấu là dừng thủ công để onend biết là cần hoàn tất
    isManualStopRef.current = true;

    setIsMicRecording(false);
    setIsMicSubmitting(true);

    const recognition = speechRecognitionRef.current;
    if (recognition) {
      recognition.stop();
      return;
    }

    // Dự phòng nếu recognition bị thiếu vì lý do nào đó
    finalizeSpeechAttempt(speechTranscriptRef.current);
  }, [finalizeSpeechAttempt, isMicRecording, isMicSubmitting]);

  const handleMicButtonClick = useCallback(() => {
    if (isMicRecording) {
      submitSpeechCapture();
      return;
    }
    if (!isMicSubmitting) {
      startSpeechCapture().catch((error) => {
        console.log("Start speech capture failed:", error);
      });
    }
  }, [
    isMicRecording,
    isMicSubmitting,
    startSpeechCapture,
    submitSpeechCapture,
  ]);

  useEffect(() => {
    return () => {
      resetSpeechSession();
    };
  }, [resetSpeechSession]);

  return {
    isMicRecording,
    isMicSubmitting,
    micLevel,
    handleMicButtonClick,
    resetSpeechSession,
  };
}
