"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, BookOpen, Layers, Search, CheckCircle2, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

interface MarketplaceCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  marketplaceCategory: string | null;
  marketplaceShortDesc: string | null;
  lessonCount: number;
  moduleCount: number;
  lessonTypes: string[];
  enrollmentCount: number;
  alreadyImported: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Seguridad":       "border-red-400/40 text-red-500 bg-red-500/10",
  "Atención cliente":"border-blue-400/40 text-blue-500 bg-blue-500/10",
  "Fitness":         "border-green-400/40 text-green-500 bg-green-500/10",
  "Operaciones":     "border-orange-400/40 text-orange-500 bg-orange-500/10",
  "Compliance":      "border-purple-400/40 text-purple-500 bg-purple-500/10",
};

export default function MarketplacePage() {
  const [courses, setCourses]   = useState<MarketplaceCourse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [planError, setPlanError] = useState<{ requiredPlan: string; currentPlan: string } | null>(null);
  const [, startTransition]     = useTransition();

  useEffect(() => {
    const url = category
      ? `/api/admin/marketplace?category=${encodeURIComponent(category)}`
      : `/api/admin/marketplace`;
    setLoading(true);
    fetch(url)
      .then(async r => {
        if (r.status === 403) {
          const data = await r.json();
          if (data.error === "PLAN_LIMIT") { setPlanError({ requiredPlan: data.requiredPlan, currentPlan: data.currentPlan }); setLoading(false); return; }
        }
        return r.json();
      })
      .then(data => { if (data) { setCourses(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(() => setLoading(false));
  }, [category]);

  const categories = [...new Set(courses.map(c => c.marketplaceCategory).filter(Boolean) as string[])];

  const filtered = courses.filter(c =>
    !query || c.title.toLowerCase().includes(query.toLowerCase()) ||
    (c.marketplaceShortDesc ?? "").toLowerCase().includes(query.toLowerCase())
  );

  async function handleImport(courseId: string, title: string) {
    setImporting(courseId);
    try {
      const res = await fetch(`/api/admin/marketplace/import/${courseId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`"${title}" importado como borrador`);
        startTransition(() => {
          setCourses(prev => prev.map(c => c.id === courseId ? { ...c, alreadyImported: true } : c));
        });
      } else if (res.status === 409) {
        toast.info("Este curso ya está en tu organización");
      } else {
        toast.error(data.error ?? "Error al importar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Marketplace de cursos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Cursos listos para usar — impórtalos a tu organización con un clic
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            className="pl-9"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={category === null ? "default" : "outline"}
            className={cn("h-9", category === null && "bg-primary text-yelau-black hover:bg-primary/90")}
            onClick={() => setCategory(null)}
          >
            Todos
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? "default" : "outline"}
              className={cn("h-9", category === cat && "bg-primary text-yelau-black hover:bg-primary/90")}
              onClick={() => setCategory(cat === category ? null : cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {planError ? (
        <UpgradeBanner feature="Marketplace de cursos" requiredPlan={planError.requiredPlan} currentPlan={planError.currentPlan} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Store className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No hay cursos disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">
              {query ? "Prueba con otra búsqueda." : "El marketplace está vacío por ahora."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => (
            <Card
              key={course.id}
              className={cn(
                "transition-all hover:border-primary/30 hover:shadow-sm flex flex-col",
                course.alreadyImported && "opacity-75"
              )}
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-muted rounded-t-xl overflow-hidden flex-shrink-0">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                {course.marketplaceCategory && (
                  <Badge variant="outline" className={cn("absolute top-2 left-2 text-[10px]", CATEGORY_COLORS[course.marketplaceCategory] ?? "border-border")}>
                    {course.marketplaceCategory}
                  </Badge>
                )}
                {course.alreadyImported && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="flex items-center gap-1.5 text-green-500 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Importado
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="pt-4 pb-4 flex flex-col flex-1 gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm leading-snug">{course.title}</p>
                  {course.marketplaceShortDesc && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.marketplaceShortDesc}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.moduleCount} mód.</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonCount} lecc.</span>
                </div>
                <Button
                  size="sm"
                  disabled={course.alreadyImported || importing === course.id}
                  onClick={() => handleImport(course.id, course.title)}
                  className={cn("w-full gap-2", course.alreadyImported
                    ? "bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/10 cursor-default"
                    : "bg-primary text-yelau-black hover:bg-primary/90 font-bold"
                  )}
                >
                  {importing === course.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importando...</>
                  ) : course.alreadyImported ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Ya importado</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" /> Importar curso</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
