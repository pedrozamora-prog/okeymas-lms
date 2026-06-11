"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, FileText, Users, X, Loader2, Command } from "lucide-react";
import { cn } from "@/lib/utils";

type ResultType = "course" | "lesson" | "user";
type Result = { type: ResultType; id: string; title: string; sub: string; href: string };

const TYPE_ICON: Record<ResultType, React.ComponentType<{ className?: string }>> = {
  course: BookOpen,
  lesson: FileText,
  user:   Users,
};
const TYPE_LABEL: Record<ResultType, string> = {
  course: "Curso",
  lesson: "Lección",
  user:   "Usuario",
};
const TYPE_COLOR: Record<ResultType, string> = {
  course: "text-primary bg-primary/10",
  lesson: "text-blue-400 bg-blue-400/10",
  user:   "text-purple-400 bg-purple-400/10",
};

export function GlobalSearch() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor]   = useState(0);
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  // Ctrl+K / Cmd+K abre el buscador
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setCursor(0);
    }
  }, [open]);

  // Búsqueda con debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setCursor(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => search(query), 250);
    return () => clearTimeout(id);
  }, [query, search]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  // Navegación con teclado
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) navigate(results[cursor].href);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border border-border bg-muted/60">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50">
        <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">

          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            {loading
              ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
              : <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            }
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar cursos, lecciones, usuarios..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Resultados */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">
                Escribe al menos 2 caracteres para buscar
              </p>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">
                Sin resultados para <span className="text-foreground font-medium">"{query}"</span>
              </p>
            )}

            {results.length > 0 && (
              <ul className="py-2">
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type];
                  return (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        onClick={() => navigate(r.href)}
                        onMouseEnter={() => setCursor(i)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          cursor === i ? "bg-muted/60" : "hover:bg-muted/30"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", TYPE_COLOR[r.type])}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block">
                          {TYPE_LABEL[r.type]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/20">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[9px]">↑↓</kbd> navegar
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[9px]">↵</kbd> abrir
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[9px]">Esc</kbd> cerrar
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
