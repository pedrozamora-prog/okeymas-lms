"use client";

import { useState } from "react";
import { Block, getVideoEmbed } from "@/lib/blocks";
import { CheckCircle2, XCircle, Info, AlertTriangle, Lightbulb, ShieldAlert, FileDown } from "lucide-react";

function HeadingRenderer({ block }: { block: Extract<Block, { type: "heading" }> }) {
  const Tag = `h${block.level}` as "h1" | "h2" | "h3";
  const cls = block.level === 1
    ? "text-2xl font-black text-foreground mt-8 mb-4"
    : block.level === 2
    ? "text-xl font-bold text-foreground mt-6 mb-3"
    : "text-base font-semibold text-foreground mt-4 mb-2";
  return <Tag className={cls}>{block.text}</Tag>;
}

function ParagraphRenderer({ block }: { block: Extract<Block, { type: "paragraph" }> }) {
  return (
    <p className="text-sm text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">
      {block.text}
    </p>
  );
}

function ImageRenderer({ block }: { block: Extract<Block, { type: "image" }> }) {
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt ?? ""}
        className="rounded-xl w-full object-cover max-h-[500px]"
      />
      {block.caption && (
        <figcaption className="text-center text-xs text-muted-foreground mt-2">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function VideoRenderer({ block }: { block: Extract<Block, { type: "video" }> }) {
  const embed = getVideoEmbed(block.url);
  if (!embed) {
    return (
      <div className="my-6 p-4 rounded-xl border border-border text-sm text-muted-foreground">
        Vídeo: <a href={block.url} target="_blank" rel="noreferrer" className="text-primary underline">{block.url}</a>
      </div>
    );
  }
  return (
    <div className="my-6">
      {block.title && <p className="text-sm font-semibold text-foreground mb-2">{block.title}</p>}
      <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embed}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={block.title ?? "Vídeo"}
        />
      </div>
    </div>
  );
}

function CalloutRenderer({ block }: { block: Extract<Block, { type: "callout" }> }) {
  const config = {
    info:    { icon: Info,          cls: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
    tip:     { icon: Lightbulb,     cls: "bg-green-500/10 border-green-500/30 text-green-400" },
    warning: { icon: AlertTriangle, cls: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
    danger:  { icon: ShieldAlert,   cls: "bg-red-500/10 border-red-500/30 text-red-400" },
  };
  const { icon: Icon, cls } = config[block.variant];
  return (
    <div className={`my-4 p-4 rounded-xl border flex gap-3 ${cls}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        {block.title && <p className="font-semibold text-sm mb-1">{block.title}</p>}
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{block.text}</p>
      </div>
    </div>
  );
}

function QuizRenderer({ block }: { block: Extract<Block, { type: "quiz" }> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct  = answered ? block.options.find(o => o.id === selected)?.correct ?? false : false;

  return (
    <div className="my-6 p-5 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3">
      <p className="text-sm font-bold text-foreground">{block.question}</p>
      <div className="space-y-2">
        {block.options.map(opt => {
          const isSelected = selected === opt.id;
          const showResult = answered && isSelected;
          return (
            <button
              key={opt.id}
              onClick={() => { if (!answered) setSelected(opt.id); }}
              disabled={answered}
              className={`w-full text-left text-sm px-4 py-3 rounded-lg border-2 transition-all ${
                showResult
                  ? opt.correct
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-red-500 bg-red-500/10 text-red-400"
                  : answered && opt.correct
                  ? "border-green-500/50 bg-green-500/5 text-green-400"
                  : "border-border hover:border-primary/50 text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                {showResult && (opt.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`text-sm p-3 rounded-lg ${correct ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {correct ? "✓ ¡Correcto!" : "✗ Incorrecto"}
          {block.explanation && <p className="mt-1 text-foreground/80">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
}

function FileRenderer({ block }: { block: Extract<Block, { type: "file" }> }) {
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noreferrer"
      className="my-4 flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileDown className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {block.filename}
        </p>
        {block.description && <p className="text-xs text-muted-foreground mt-0.5">{block.description}</p>}
      </div>
    </a>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks?.length) return null;

  return (
    <div className="space-y-1">
      {blocks.map(block => {
        switch (block.type) {
          case "heading":   return <HeadingRenderer   key={block.id} block={block} />;
          case "paragraph": return <ParagraphRenderer key={block.id} block={block} />;
          case "image":     return <ImageRenderer     key={block.id} block={block} />;
          case "video":     return <VideoRenderer     key={block.id} block={block} />;
          case "callout":   return <CalloutRenderer   key={block.id} block={block} />;
          case "quiz":      return <QuizRenderer      key={block.id} block={block} />;
          case "file":      return <FileRenderer      key={block.id} block={block} />;
          case "divider":   return <hr key={block.id} className="my-6 border-border" />;
          default:          return null;
        }
      })}
    </div>
  );
}
