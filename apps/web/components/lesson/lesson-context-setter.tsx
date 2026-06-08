"use client";

import { useEffect } from "react";
import { useTutorContext, type LessonContext } from "@/lib/tutor-context";

interface Props {
  ctx: LessonContext;
}

export function LessonContextSetter({ ctx }: Props) {
  const { setLessonCtx, clearLessonCtx } = useTutorContext();

  useEffect(() => {
    setLessonCtx(ctx);
    return () => clearLessonCtx();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.lessonTitle]);

  return null;
}
