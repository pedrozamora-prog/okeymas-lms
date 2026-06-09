"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Trophy, Users, Brain, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Insight {
  urgency:  "alta" | "media" | "baja";
  category: "engagement" | "completado" | "evaluacion" | "riesgo" | "logro";
  title:    string;
  body:     string;
  action:   string;
}

const categoryIcon: Record<Insight["category"], React.ReactNode> = {
  engagement: <Users  className="w-5 h-5" />,
  completado: <TrendingUp className="w-5 h-5" />,
  evaluacion: <Brain  className="w-5 h-5" />,
  riesgo:     <AlertTriangle className="w-5 h-5" />,
  logro:      <Trophy className="w-5 h-5" />,
};

const urgencyConfig = {
  alta:  { label: "Urgente",  className: "bg-red-500/15 text-red-400 border-red-500/30"    },
  media: { label: "Atención", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  baja:  { label: "Info",     className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

const categoryColor: Record<Insight["category"], string> = {
  riesgo:     "text-red-400    bg-red-500/10    border-red-500/20",
  engagement: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  evaluacion: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  completado: "text-blue-400   bg-blue-500/10   border-blue-500/20",
  logro:      "text-green-400  bg-green-500/10  border-green-500/20",
};

export default function InsightsPage() {
  const [insights,     setInsights]     = useState<Insight[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [generatedAt,  setGeneratedAt]  = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/ai/insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setInsights(data.insights ?? []);
      setGeneratedAt(data.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar insights");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Insights IA</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Análisis inteligente de tu plataforma con recomendaciones accionables
          </p>
        </div>

        <Button
          onClick={generate}
          disabled={loading}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando…</>
            : insights.length > 0
              ? <><RefreshCw className="w-4 h-4" /> Regenerar</>
              : <><Sparkles className="w-4 h-4" /> Generar insights</>
          }
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && insights.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">Análisis de formación bajo demanda</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              La IA analiza completados, quiz, engagement y riesgos de compliance para darte recomendaciones concretas.
            </p>
          </div>
          <Button onClick={generate} className="gap-2">
            <Sparkles className="w-4 h-4" /> Generar mi primer análisis
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className={cn("animate-pulse", i === 0 && "md:col-span-2")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-4/6" />
                <div className="h-8 bg-muted rounded mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights grid */}
      {!loading && insights.length > 0 && (
        <>
          {generatedAt && (
            <p className="text-xs text-muted-foreground -mt-4">
              Generado el {new Date(generatedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => {
              const urgency  = urgencyConfig[insight.urgency]  ?? urgencyConfig.baja;
              const colorCls = categoryColor[insight.category] ?? categoryColor.completado;

              return (
                <Card
                  key={i}
                  className={cn(
                    "border transition-all hover:shadow-md hover:-translate-y-0.5",
                    i === 0 && "md:col-span-2",
                    insight.urgency === "alta" && "border-red-500/30"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border", colorCls)}>
                        {categoryIcon[insight.category] ?? <Sparkles className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-snug">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-xs border", urgency.className)}>
                            {urgency.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">{insight.category}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>

                    <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium">{insight.action}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
