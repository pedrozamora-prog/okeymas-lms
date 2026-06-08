"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Send, Loader2, MessageSquare, Target,
  CheckCircle2, Trophy, TrendingUp, TrendingDown, Flag,
  User, Bot,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Message { role: "employee" | "customer"; content: string; ts: string; }
interface Evaluation {
  score:             number;
  objectiveAchieved: boolean;
  tone:              string;
  summary:           string;
  strengths:         string[];
  improvements:      string[];
}
interface Scenario { id: string; title: string; description: string | null; objective: string; difficulty: string; }

const MAX_TURNS = 15;

export default function SimulationPage() {
  const params     = useParams();
  const router     = useRouter();
  const scenarioId = params.scenarioId as string;

  const [phase,      setPhase]      = useState<"briefing" | "chat" | "results">("briefing");
  const [scenario,   setScenario]   = useState<Scenario | null>(null);
  const [attemptId,  setAttemptId]  = useState<string | null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [turnsLeft,  setTurnsLeft]  = useState(MAX_TURNS);
  const [finishing,  setFinishing]  = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [score,      setScore]      = useState<number | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Load scenario metadata for briefing screen (read-only, no attempt created)
  useEffect(() => {
    fetch(`/api/simulations/${scenarioId}`)
      .then(r => r.json())
      .then(d => { if (d.id) setScenario(d); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function startSimulation() {
    try {
      const res  = await fetch(`/api/simulations/${scenarioId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAttemptId(data.attemptId);
      setScenario(data.scenario);
      setMessages([{
        role:    "customer",
        content: getOpeningLine(data.scenario.difficulty),
        ts:      new Date().toISOString(),
      }]);
      setPhase("chat");
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al iniciar");
    }
  }

  function getOpeningLine(difficulty: string): string {
    const openings: Record<string, string[]> = {
      EASY: ["Hola, buenos días. Quería hablar con alguien de recepción.", "Hola, ¿me podéis ayudar con algo?"],
      MEDIUM: ["Hola. Necesito hablar con alguien, tengo un problema.", "Buenas, ¿hay alguien disponible? Es sobre mi cuenta."],
      HARD: ["Mira, llevo un rato esperando y necesito que me atiendan YA.", "Buenos días, necesito resolver algo urgente."],
    };
    const list = openings[difficulty] ?? openings.MEDIUM;
    return list[Math.floor(Math.random() * list.length)];
  }

  async function sendMessage() {
    if (!input.trim() || sending || !attemptId) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    const userMsg: Message = { role: "employee", content: text, ts: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);

    try {
      const res  = await fetch(`/api/simulations/${attemptId}/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(m => [...m, { role: "customer", content: data.reply, ts: new Date().toISOString() }]);
      setTurnsLeft(data.turnsLeft);

      if (data.turnsLeft <= 0) {
        toast.info("Has llegado al límite de turnos. Finaliza la conversación.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de conexión");
      setMessages(m => m.slice(0, -1));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function finishSimulation() {
    if (!attemptId) return;
    setFinishing(true);
    try {
      const res  = await fetch(`/api/simulations/${attemptId}/finish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScore(data.score);
      setEvaluation(data.evaluation);
      setPhase("results");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al evaluar");
    } finally {
      setFinishing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ─── BRIEFING ───────────────────────────────────────────────────────────────
  if (phase === "briefing") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard/simulations">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">
                {scenario?.title ?? "Cargando…"}
              </h1>
              <p className="text-sm text-muted-foreground">Simulación de atención al cliente</p>
            </div>
          </div>

          {scenario?.description && (
            <p className="text-sm text-muted-foreground">{scenario.description}</p>
          )}

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Tu objetivo
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {scenario?.objective ?? "Cargando…"}
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Cómo funciona:</p>
            <ul className="space-y-1.5 list-none">
              {[
                "Hablarás por chat con un cliente IA que simulará una situación real",
                `Tienes hasta ${MAX_TURNS} turnos para resolver la situación`,
                "Al terminar, la IA evaluará tu actuación con puntuación y feedback",
                "Cuanto mejor manejes la situación, mayor será tu puntuación",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={startSimulation} className="w-full gap-2 h-11">
            <MessageSquare className="w-4 h-4" />
            Iniciar simulación
          </Button>
        </div>
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === "results" && evaluation) {
    const s = score ?? 0;
    const color = s >= 80 ? "text-green-400" : s >= 60 ? "text-amber-500" : "text-red-400";
    const bg    = s >= 80 ? "bg-green-500/10 border-green-500/20" : s >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard/simulations">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Volver a escenarios
          </Button>
        </Link>

        <div className="rounded-2xl border bg-card p-8 space-y-6">
          {/* Score */}
          <div className="text-center space-y-2">
            <Trophy className={cn("w-12 h-12 mx-auto", color)} />
            <p className="text-5xl font-black text-foreground">{s}<span className="text-2xl text-muted-foreground">/100</span></p>
            <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold", bg, color)}>
              {evaluation.objectiveAchieved ? <CheckCircle2 className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
              {evaluation.objectiveAchieved ? "Objetivo conseguido" : "Objetivo no alcanzado"}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-foreground leading-relaxed">{evaluation.summary}</p>
            <p className="text-xs text-muted-foreground mt-2">Tono: <span className="font-medium capitalize">{evaluation.tone}</span></p>
          </div>

          {/* Strengths & improvements */}
          <div className="grid sm:grid-cols-2 gap-4">
            {evaluation.strengths?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Puntos fuertes
                </p>
                <ul className="space-y-1.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.improvements?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" /> Áreas de mejora
                </p>
                <ul className="space-y-1.5">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="w-3.5 h-3.5 rounded-full border border-amber-500/50 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => { setPhase("briefing"); setMessages([]); setAttemptId(null); setTurnsLeft(MAX_TURNS); }} variant="outline" className="flex-1">
              Repetir escenario
            </Button>
            <Button asChild className="flex-1">
              <Link href="/dashboard/simulations">Ver más escenarios</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHAT ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 pb-4 border-b border-border flex-shrink-0">
        <Link href="/dashboard/simulations">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{scenario?.title}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3 text-primary/60" />
            {scenario?.objective}
          </p>
        </div>
        <Badge className={cn("text-[10px] flex-shrink-0",
          turnsLeft <= 3 ? "bg-red-500/10 text-red-400 border-red-500/20 border"
          : "bg-muted text-muted-foreground"
        )}>
          {turnsLeft} turnos
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={finishSimulation}
          disabled={finishing || messages.length < 3}
          className="gap-1.5 flex-shrink-0 h-8 text-xs"
        >
          {finishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
          Finalizar
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "employee" ? "justify-end" : "justify-start")}>
            {m.role === "customer" && (
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className={cn(
              "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
              m.role === "employee"
                ? "bg-primary text-yelau-black font-medium rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            )}>
              {m.content}
            </div>
            {m.role === "employee" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-border flex-shrink-0">
        {turnsLeft <= 0 ? (
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground mb-3">Has llegado al límite de turnos.</p>
            <Button onClick={finishSimulation} disabled={finishing} className="gap-2">
              {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              Ver mi evaluación
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu respuesta al cliente…"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none bg-muted text-sm text-foreground placeholder:text-muted-foreground rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[42px] max-h-28 disabled:opacity-50"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 text-yelau-black animate-spin" /> : <Send className="w-4 h-4 text-yelau-black" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
