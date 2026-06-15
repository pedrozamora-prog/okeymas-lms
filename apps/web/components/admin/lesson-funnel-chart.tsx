"use client";

import { useState } from "react";

interface LessonStat {
  id:          string;
  title:       string;
  type:        string;
  order:       number;
  compRate:    number;
  dropout:     number;
  completed:   number;
  moduleTitle: string;
}

interface Props {
  lessons:        LessonStat[];
  totalEnrolled:  number;
}

function barColor(rate: number, isWorst: boolean) {
  if (isWorst)   return "bg-red-500";
  if (rate >= 75) return "bg-green-500";
  if (rate >= 50) return "bg-amber-400";
  return "bg-red-400";
}

export function LessonFunnelChart({ lessons, totalEnrolled }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (lessons.length === 0 || totalEnrolled === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Aún no hay datos de progreso para este curso.
      </p>
    );
  }

  const worstId = [...lessons].sort((a, b) => b.dropout - a.dropout)[0]?.id;

  return (
    <div className="space-y-1.5">
      {/* Eje superior */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 mb-2">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {lessons.map(lesson => {
        const isHovered = hoveredId === lesson.id;
        const isWorst   = lesson.id === worstId && lesson.dropout > 0;
        const color     = barColor(lesson.compRate, isWorst);

        return (
          <div
            key={lesson.id}
            className="group relative"
            onMouseEnter={() => setHoveredId(lesson.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-center gap-2">
              {/* Número */}
              <span className="text-[10px] text-muted-foreground font-mono w-5 text-right flex-shrink-0">
                {lesson.order}
              </span>

              {/* Barra */}
              <div className="flex-1 relative">
                <div className="w-full h-7 bg-muted/40 rounded-md overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${color} ${isHovered ? "opacity-90" : "opacity-70"}`}
                    style={{ width: `${lesson.compRate}%` }}
                  />
                </div>

                {/* Label dentro/fuera de la barra */}
                <div className="absolute inset-0 flex items-center px-2 gap-2">
                  <span
                    className={`text-[11px] font-semibold truncate max-w-[55%] ${
                      lesson.compRate > 25 ? "text-white drop-shadow-sm" : "text-foreground"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  <span className={`text-[11px] font-black ml-auto ${
                    lesson.compRate > 15 ? "text-white drop-shadow-sm" : "text-foreground"
                  }`}>
                    {lesson.compRate}%
                  </span>
                </div>
              </div>

              {/* Dropout badge */}
              <div className="w-14 flex-shrink-0 text-right">
                {lesson.dropout > 0 ? (
                  <span className={`text-[10px] font-semibold ${
                    isWorst           ? "text-red-500" :
                    lesson.dropout >= 15 ? "text-amber-500" :
                                          "text-muted-foreground"
                  }`}>
                    {isWorst ? "⚠ " : ""}−{lesson.dropout}%
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {/* Tooltip */}
            {isHovered && (
              <div className="absolute left-8 top-8 z-20 bg-popover border border-border rounded-lg shadow-xl p-3 text-xs min-w-[200px] pointer-events-none">
                <p className="font-bold text-foreground mb-1 truncate">{lesson.title}</p>
                <p className="text-muted-foreground text-[10px] mb-2">{lesson.moduleTitle}</p>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Completaron</span>
                    <span className="font-semibold text-foreground">{lesson.completed} / {totalEnrolled}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Tasa</span>
                    <span className={`font-bold ${
                      lesson.compRate >= 70 ? "text-green-500" :
                      lesson.compRate >= 40 ? "text-amber-500" : "text-red-500"
                    }`}>{lesson.compRate}%</span>
                  </div>
                  {lesson.dropout > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Abandono respecto anterior</span>
                      <span className="font-semibold text-red-500">−{lesson.dropout}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Leyenda */}
      <div className="flex items-center gap-4 pt-3 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> ≥ 75%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> 50–74%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> &lt; 50%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Mayor abandono</span>
      </div>
    </div>
  );
}
