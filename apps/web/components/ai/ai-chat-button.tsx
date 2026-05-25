"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function AiChatButton() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "¡Hola! Soy tu asistente de formación 👋 Pregúntame cualquier cosa sobre el curso de Acondicionamiento Físico." },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: next.slice(0, -1) }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", text: data.text ?? "Error al obtener respuesta." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Error de conexión. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Panel */}
      <div className={cn(
        "fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 flex flex-col",
        "bg-card border border-border rounded-2xl shadow-2xl shadow-black/50",
        "transition-all duration-300 origin-bottom-right",
        open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      )} style={{ maxHeight: "70dvh" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-yelau-yellow flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-yelau-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Asistente IA</p>
            <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-yelau-yellow flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-yelau-black" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-yelau-yellow text-yelau-black font-medium rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-md bg-yelau-yellow flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-yelau-black" />
              </div>
              <div className="bg-muted px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              className="flex-1 resize-none bg-muted text-sm text-foreground placeholder:text-muted-foreground rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50 min-h-[40px] max-h-24"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-yelau-yellow flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-yelau-yellow/90 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 text-yelau-black animate-spin" /> : <Send className="w-4 h-4 text-yelau-black" />}
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-2xl shadow-lg shadow-black/40",
          "flex items-center justify-center transition-all duration-300",
          open
            ? "bg-muted text-muted-foreground rotate-0"
            : "bg-yelau-yellow text-yelau-black hover:scale-110 hover:shadow-yelau-yellow/30 hover:shadow-xl"
        )}
        aria-label="Asistente IA"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
      </button>
    </>
  );
}
