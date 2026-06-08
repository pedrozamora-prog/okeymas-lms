"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface LessonContext {
  courseTitle:  string;
  moduleTitle:  string;
  lessonTitle:  string;
  lessonType:   string;
  contentText:  string; // extracted plain text from content blocks
}

interface TutorContextValue {
  lessonCtx: LessonContext | null;
  setLessonCtx:   (ctx: LessonContext | null) => void;
  clearLessonCtx: () => void;
}

const TutorContext = createContext<TutorContextValue | null>(null);

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const [lessonCtx, setLessonCtxState] = useState<LessonContext | null>(null);

  const setLessonCtx   = useCallback((ctx: LessonContext | null) => setLessonCtxState(ctx), []);
  const clearLessonCtx = useCallback(() => setLessonCtxState(null), []);

  return (
    <TutorContext.Provider value={{ lessonCtx, setLessonCtx, clearLessonCtx }}>
      {children}
    </TutorContext.Provider>
  );
}

const FALLBACK: TutorContextValue = {
  lessonCtx:      null,
  setLessonCtx:   () => {},
  clearLessonCtx: () => {},
};

export function useTutorContext(): TutorContextValue {
  return useContext(TutorContext) ?? FALLBACK;
}
