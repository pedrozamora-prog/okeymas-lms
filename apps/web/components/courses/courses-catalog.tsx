"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/courses/course-card";
import { BookOpen, Search, X } from "lucide-react";

type Tab = "all" | "inprogress" | "completed" | "available" | "required";

interface CourseItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  isRequired: boolean;
  modules: { lessons: { id: string }[] }[];
  _count: { enrollments: number };
  enrolled: boolean;
  progress: number;
  completed: boolean;
  avgRating?: number | null;
  ratingCount?: number;
}

interface Props {
  courses: CourseItem[];
  labels: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noCourses: string;
    noCoursesDesc: string;
  };
}

const TABS: { id: Tab; label: string }[] = [
  { id: "all",        label: "Todos"       },
  { id: "inprogress", label: "En progreso" },
  { id: "completed",  label: "Completados" },
  { id: "available",  label: "Disponibles" },
  { id: "required",   label: "Obligatorios"},
];

export function CoursesCatalog({ courses, labels }: Props) {
  const [search, setSearch] = useState("");
  const [tab,    setTab]    = useState<Tab>("all");

  const filtered = useMemo(() => {
    let list = courses;

    // Tab filter
    if (tab === "inprogress") list = list.filter(c => c.enrolled && !c.completed && c.progress > 0);
    if (tab === "completed")  list = list.filter(c => c.completed);
    if (tab === "available")  list = list.filter(c => !c.enrolled);
    if (tab === "required")   list = list.filter(c => c.isRequired);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [courses, tab, search]);

  const counts: Record<Tab, number> = useMemo(() => ({
    all:        courses.length,
    inprogress: courses.filter(c => c.enrolled && !c.completed && c.progress > 0).length,
    completed:  courses.filter(c => c.completed).length,
    available:  courses.filter(c => !c.enrolled).length,
    required:   courses.filter(c => c.isRequired).length,
  }), [courses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">{labels.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{labels.subtitle}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.filter(t => counts[t.id] > 0 || t.id === "all").map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              tab === t.id
                ? "bg-primary text-yelau-black border-primary"
                : "bg-background text-muted-foreground border-border hover:border-muted-foreground/40"
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-bold ${tab === t.id ? "opacity-80" : "opacity-60"}`}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              enrolled={course.enrolled}
              progress={course.progress}
              avgRating={course.avgRating}
              ratingCount={course.ratingCount}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
          {search ? (
            <>
              <p className="font-semibold text-foreground">Sin resultados para &ldquo;{search}&rdquo;</p>
              <button
                onClick={() => setSearch("")}
                className="text-sm text-primary hover:underline"
              >
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">{labels.noCourses}</p>
              <p className="text-muted-foreground text-sm">{labels.noCoursesDesc}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
