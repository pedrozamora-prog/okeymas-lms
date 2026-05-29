"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, FileText, HelpCircle, Radio, Lock, CheckCircle2, ChevronDown } from "lucide-react";

const LESSON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  VIDEO:      Video,
  PDF:        FileText,
  QUIZ:       HelpCircle,
  LIVE_CLASS: Radio,
  SCORM:      FileText,
};

const LESSON_LABELS: Record<string, string> = {
  VIDEO:      "Video",
  PDF:        "PDF",
  QUIZ:       "Quiz",
  LIVE_CLASS: "En directo",
  SCORM:      "SCORM",
};

interface Lesson { id: string; title: string; type: string; duration?: number | null; isRequired: boolean }
interface Module  { id: string; title: string; lessons: Lesson[] }

interface LessonListProps {
  modules: Module[];
  userId: string;
  courseId: string;
  enrolled: boolean;
  completedIds?: Set<string>;
}

export function LessonList({ modules, courseId, enrolled, completedIds = new Set() }: LessonListProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set([modules[0]?.id]));

  const toggleModule = (id: string) =>
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {modules.map(module => {
        const isOpen = openModules.has(module.id);
        const completedInModule = module.lessons.filter(l => completedIds.has(l.id)).length;
        const moduleProgress = module.lessons.length > 0
          ? Math.round((completedInModule / module.lessons.length) * 100)
          : 0;

        return (
          <div key={module.id} className="border border-border rounded-xl overflow-hidden">
            {/* Module header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between gap-3 p-4 bg-card hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{module.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {module.lessons.length} lecciones · {completedInModule} completadas
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {enrolled && (
                  <div className="hidden sm:flex items-center gap-2 w-24">
                    <Progress value={moduleProgress} className="h-1" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{moduleProgress}%</span>
                  </div>
                )}
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </button>

            {/* Lessons */}
            {isOpen && (
              <div className="border-t border-border divide-y divide-border">
                {module.lessons.map((lesson) => {
                  const Icon = LESSON_ICONS[lesson.type] ?? FileText;
                  const isCompleted = completedIds.has(lesson.id);
                  const isLocked = !enrolled;

                  const content = (
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors",
                      isLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/30 cursor-pointer",
                    )}>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                        isCompleted ? "bg-green-500/10" : "bg-muted",
                      )}>
                        {isCompleted
                          ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                          : isLocked
                          ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          : <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate", isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
                          {lesson.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px] hidden sm:flex">
                          {LESSON_LABELS[lesson.type]}
                        </Badge>
                        {lesson.duration && (
                          <span className="text-xs text-muted-foreground">{lesson.duration}min</span>
                        )}
                      </div>
                    </div>
                  );

                  return isLocked ? (
                    <div key={lesson.id}>{content}</div>
                  ) : (
                    <Link key={lesson.id} href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
