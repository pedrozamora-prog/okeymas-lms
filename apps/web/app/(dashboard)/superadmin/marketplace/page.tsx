"use client";

import { useEffect, useState, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Store, BookOpen, Layers, Search, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SuperCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isMarketplace: boolean;
  marketplaceCategory: string | null;
  marketplaceShortDesc: string | null;
  status: string;
  org: string;
  orgSlug: string;
  moduleCount: number;
  lessonCount: number;
}

const CATEGORIES = ["Seguridad", "Atención cliente", "Fitness", "Operaciones", "Compliance"];

export default function SuperAdminMarketplacePage() {
  const [courses, setCourses]   = useState<SuperCourse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [saving, setSaving]     = useState<string | null>(null);
  const [editing, setEditing]   = useState<string | null>(null);
  const [catMap, setCatMap]     = useState<Record<string, string>>({});
  const [descMap, setDescMap]   = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/superadmin/marketplace")
      .then(r => r.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
        const cats: Record<string, string> = {};
        const descs: Record<string, string> = {};
        (data as SuperCourse[]).forEach(c => {
          cats[c.id]  = c.marketplaceCategory  ?? "";
          descs[c.id] = c.marketplaceShortDesc ?? "";
        });
        setCatMap(cats);
        setDescMap(descs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    !query ||
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.org.toLowerCase().includes(query.toLowerCase())
  );

  const marketplaceCount = courses.filter(c => c.isMarketplace).length;

  async function toggle(courseId: string, current: boolean) {
    setSaving(courseId);
    const isMarketplace = !current;
    const body: Record<string, unknown> = { courseId, isMarketplace };
    if (isMarketplace) {
      body.marketplaceCategory  = catMap[courseId]  || null;
      body.marketplaceShortDesc = descMap[courseId] || null;
    }
    try {
      const res = await fetch("/api/superadmin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCourses(prev => prev.map(c =>
          c.id === courseId ? { ...c, isMarketplace, marketplaceCategory: isMarketplace ? (catMap[courseId] || null) : null } : c
        ));
        toast.success(isMarketplace ? "Publicado en marketplace" : "Retirado del marketplace");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(null);
    }
  }

  async function saveMetadata(courseId: string) {
    setSaving(courseId);
    try {
      const res = await fetch("/api/superadmin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          isMarketplace:        true,
          marketplaceCategory:  catMap[courseId]  || null,
          marketplaceShortDesc: descMap[courseId] || null,
        }),
      });
      if (res.ok) {
        setCourses(prev => prev.map(c =>
          c.id === courseId
            ? { ...c, marketplaceCategory: catMap[courseId] || null, marketplaceShortDesc: descMap[courseId] || null }
            : c
        ));
        setEditing(null);
        toast.success("Metadatos actualizados");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(null);
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
            <h1 className="text-2xl font-black text-foreground">Gestión del Marketplace</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {marketplaceCount} curso{marketplaceCount !== 1 ? "s" : ""} publicado{marketplaceCount !== 1 ? "s" : ""} en el marketplace
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre u organización..."
          className="pl-9"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No hay cursos publicados que coincidan.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Curso</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Organización</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden lg:table-cell">Contenido</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Marketplace</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course, i) => (
                <Fragment key={course.id}>
                  <tr
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      i % 2 === 0 ? "" : "bg-muted/20",
                      course.isMarketplace && "bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {course.isMarketplace
                            ? <CheckCircle2 className="w-4 h-4 text-primary" />
                            : <BookOpen className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                        <p className="font-medium text-foreground leading-snug">{course.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>
                        <p className="text-foreground">{course.org}</p>
                        <p className="text-xs text-muted-foreground">{course.orgSlug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {course.moduleCount} mód.
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {course.lessonCount} lecc.
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {saving === course.id
                          ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          : (
                            <Switch
                              checked={course.isMarketplace}
                              onCheckedChange={() => toggle(course.id, course.isMarketplace)}
                              className="data-[state=checked]:bg-primary"
                            />
                          )
                        }
                        {course.isMarketplace && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => setEditing(editing === course.id ? null : course.id)}
                          >
                            {editing === course.id ? "Cancelar" : "Editar"}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {course.isMarketplace && course.marketplaceCategory ? (
                        <Badge variant="outline" className="text-[11px]">
                          {course.marketplaceCategory}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                  {/* Inline metadata editor */}
                  {editing === course.id && (
                    <tr className="border-b border-border bg-primary/5">
                      <td colSpan={5} className="px-4 pb-4 pt-1">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                          <div className="flex flex-col gap-1 flex-1">
                            <Label className="text-xs">Categoría</Label>
                            <select
                              value={catMap[course.id] ?? ""}
                              onChange={e => setCatMap(p => ({ ...p, [course.id]: e.target.value }))}
                              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="">Sin categoría</option>
                              {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1 flex-[2]">
                            <Label className="text-xs">Descripción corta (marketplace)</Label>
                            <Input
                              value={descMap[course.id] ?? ""}
                              onChange={e => setDescMap(p => ({ ...p, [course.id]: e.target.value }))}
                              placeholder="Ej: Aprende protocolos de apertura segura del centro..."
                              className="h-9"
                            />
                          </div>
                          <Button
                            size="sm"
                            disabled={saving === course.id}
                            onClick={() => saveMetadata(course.id)}
                            className="h-9 bg-primary text-yelau-black hover:bg-primary/90 font-bold flex-shrink-0"
                          >
                            {saving === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Guardar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
