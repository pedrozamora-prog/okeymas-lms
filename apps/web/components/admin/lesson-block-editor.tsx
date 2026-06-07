"use client";

import { useState, useCallback } from "react";
import { Block, QuizOption, getVideoEmbed } from "@/lib/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Heading1, Heading2, Heading3, AlignLeft, Image, Video,
  Info, AlertTriangle, Lightbulb, ShieldAlert, HelpCircle,
  Minus, FileDown, CheckCircle2, XCircle,
} from "lucide-react";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Block type palette ────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: "heading",   label: "Título H1",    icon: Heading1 },
  { type: "heading2",  label: "Título H2",    icon: Heading2 },
  { type: "heading3",  label: "Título H3",    icon: Heading3 },
  { type: "paragraph", label: "Párrafo",      icon: AlignLeft },
  { type: "image",     label: "Imagen",       icon: Image },
  { type: "video",     label: "Vídeo",        icon: Video },
  { type: "callout",   label: "Aviso info",   icon: Info },
  { type: "warning",   label: "Advertencia",  icon: AlertTriangle },
  { type: "tip",       label: "Consejo",      icon: Lightbulb },
  { type: "danger",    label: "Peligro",      icon: ShieldAlert },
  { type: "quiz",      label: "Pregunta",     icon: HelpCircle },
  { type: "file",      label: "Archivo",      icon: FileDown },
  { type: "divider",   label: "Separador",    icon: Minus },
];

function addBlock(type: string): Block {
  const id = uid();
  if (type === "heading")   return { id, type: "heading",   level: 1, text: "" };
  if (type === "heading2")  return { id, type: "heading",   level: 2, text: "" };
  if (type === "heading3")  return { id, type: "heading",   level: 3, text: "" };
  if (type === "paragraph") return { id, type: "paragraph", text: "" };
  if (type === "image")     return { id, type: "image",     url: "", alt: "", caption: "" };
  if (type === "video")     return { id, type: "video",     url: "", title: "" };
  if (type === "callout")   return { id, type: "callout",   variant: "info",    title: "", text: "" };
  if (type === "warning")   return { id, type: "callout",   variant: "warning", title: "", text: "" };
  if (type === "tip")       return { id, type: "callout",   variant: "tip",     title: "", text: "" };
  if (type === "danger")    return { id, type: "callout",   variant: "danger",  title: "", text: "" };
  if (type === "quiz")      return { id, type: "quiz", question: "", options: [{ id: uid(), text: "", correct: true }, { id: uid(), text: "", correct: false }], explanation: "" };
  if (type === "file")      return { id, type: "file",      url: "", filename: "", description: "" };
  return { id, type: "divider" };
}

// ── Individual block editors ──────────────────────────────────────────────────

function HeadingEditor({ block, onChange }: { block: Extract<Block, { type: "heading" }>; onChange: (b: Block) => void }) {
  const sizes = { 1: "text-2xl font-black", 2: "text-xl font-bold", 3: "text-base font-semibold" };
  return (
    <input
      className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 ${sizes[block.level]}`}
      placeholder={`Título H${block.level}`}
      value={block.text}
      onChange={e => onChange({ ...block, text: e.target.value })}
    />
  );
}

function ParagraphEditor({ block, onChange }: { block: Extract<Block, { type: "paragraph" }>; onChange: (b: Block) => void }) {
  return (
    <Textarea
      className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 min-h-[80px]"
      placeholder="Escribe el contenido del párrafo..."
      value={block.text}
      onChange={e => onChange({ ...block, text: e.target.value })}
    />
  );
}

function ImageEditor({ block, onChange }: { block: Extract<Block, { type: "image" }>; onChange: (b: Block) => void }) {
  return (
    <div className="space-y-2">
      <Input placeholder="URL de la imagen" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })} />
      {block.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.url} alt={block.alt ?? ""} className="rounded-lg max-h-48 object-cover w-full" onError={e => (e.currentTarget.style.display = "none")} />
      )}
      <Input placeholder="Texto alternativo (accesibilidad)" value={block.alt ?? ""} onChange={e => onChange({ ...block, alt: e.target.value })} />
      <Input placeholder="Pie de foto (opcional)" value={block.caption ?? ""} onChange={e => onChange({ ...block, caption: e.target.value })} />
    </div>
  );
}

function VideoEditor({ block, onChange }: { block: Extract<Block, { type: "video" }>; onChange: (b: Block) => void }) {
  const embed = getVideoEmbed(block.url);
  return (
    <div className="space-y-2">
      <Input placeholder="URL de YouTube, Vimeo o vídeo directo (.mp4)" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })} />
      {embed && (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <iframe src={embed} className="absolute inset-0 w-full h-full" allowFullScreen title="preview" />
        </div>
      )}
      <Input placeholder="Título del vídeo (opcional)" value={block.title ?? ""} onChange={e => onChange({ ...block, title: e.target.value })} />
    </div>
  );
}

function CalloutEditor({ block, onChange }: { block: Extract<Block, { type: "callout" }>; onChange: (b: Block) => void }) {
  const colors = {
    info:    "border-blue-500/30 bg-blue-500/10",
    tip:     "border-green-500/30 bg-green-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    danger:  "border-red-500/30 bg-red-500/10",
  };
  return (
    <div className={`p-3 rounded-xl border ${colors[block.variant]} space-y-2`}>
      <Input
        className="bg-transparent border-none text-sm font-semibold placeholder:text-muted-foreground/40"
        placeholder="Título (opcional)"
        value={block.title ?? ""}
        onChange={e => onChange({ ...block, title: e.target.value })}
      />
      <Textarea
        className="bg-transparent border-none text-sm resize-none min-h-[60px] placeholder:text-muted-foreground/40"
        placeholder="Texto del aviso..."
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
      />
    </div>
  );
}

function QuizEditor({ block, onChange }: { block: Extract<Block, { type: "quiz" }>; onChange: (b: Block) => void }) {
  function updateOption(id: string, patch: Partial<QuizOption>) {
    onChange({ ...block, options: block.options.map(o => o.id === id ? { ...o, ...patch } : o) });
  }
  function addOption() {
    onChange({ ...block, options: [...block.options, { id: uid(), text: "", correct: false }] });
  }
  function removeOption(id: string) {
    if (block.options.length <= 2) return;
    onChange({ ...block, options: block.options.filter(o => o.id !== id) });
  }

  return (
    <div className="space-y-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
      <Input
        className="font-semibold bg-transparent border-none"
        placeholder="¿Cuál es la pregunta?"
        value={block.question}
        onChange={e => onChange({ ...block, question: e.target.value })}
      />
      <div className="space-y-2">
        {block.options.map(opt => (
          <div key={opt.id} className="flex items-center gap-2">
            <button
              onClick={() => {
                const updated = block.options.map(o => ({ ...o, correct: o.id === opt.id }));
                onChange({ ...block, options: updated });
              }}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                opt.correct ? "border-green-500 bg-green-500" : "border-border"
              }`}
            >
              {opt.correct && <CheckCircle2 className="w-3 h-3 text-white m-auto" />}
            </button>
            <Input
              className="flex-1 bg-transparent text-sm"
              placeholder={`Opción ${block.options.indexOf(opt) + 1}`}
              value={opt.text}
              onChange={e => updateOption(opt.id, { text: e.target.value })}
            />
            <button onClick={() => removeOption(opt.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addOption} className="gap-1 text-xs">
        <Plus className="w-3 h-3" /> Añadir opción
      </Button>
      <Input
        className="bg-transparent border-none text-xs text-muted-foreground"
        placeholder="Explicación de la respuesta correcta (opcional)"
        value={block.explanation ?? ""}
        onChange={e => onChange({ ...block, explanation: e.target.value })}
      />
    </div>
  );
}

function FileEditor({ block, onChange }: { block: Extract<Block, { type: "file" }>; onChange: (b: Block) => void }) {
  return (
    <div className="space-y-2">
      <Input placeholder="URL del archivo" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })} />
      <Input placeholder="Nombre del archivo (ej: Manual_seguridad.pdf)" value={block.filename} onChange={e => onChange({ ...block, filename: e.target.value })} />
      <Input placeholder="Descripción (opcional)" value={block.description ?? ""} onChange={e => onChange({ ...block, description: e.target.value })} />
    </div>
  );
}

// ── Block row wrapper ─────────────────────────────────────────────────────────

function BlockRow({
  block, index, total,
  onChange, onDelete, onMove,
}: {
  block: Block; index: number; total: number;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const typeLabel = BLOCK_TYPES.find(t =>
    t.type === block.type ||
    (block.type === "callout" && t.type === block.variant) ||
    (block.type === "heading" && t.type === `heading${block.level === 1 ? "" : block.level}`)
  )?.label ?? block.type;

  return (
    <div className="group flex gap-2 items-start">
      {/* Drag handle + move */}
      <div className="flex flex-col items-center gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onMove(-1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 border border-transparent group-hover:border-border rounded-xl p-3 transition-colors min-w-0">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[10px] text-muted-foreground">{typeLabel}</Badge>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {block.type === "heading"   && <HeadingEditor   block={block} onChange={onChange} />}
        {block.type === "paragraph" && <ParagraphEditor block={block} onChange={onChange} />}
        {block.type === "image"     && <ImageEditor     block={block} onChange={onChange} />}
        {block.type === "video"     && <VideoEditor     block={block} onChange={onChange} />}
        {block.type === "callout"   && <CalloutEditor   block={block} onChange={onChange} />}
        {block.type === "quiz"      && <QuizEditor      block={block} onChange={onChange} />}
        {block.type === "file"      && <FileEditor      block={block} onChange={onChange} />}
        {block.type === "divider"   && <div className="border-t border-border my-1" />}
      </div>
    </div>
  );
}

// ── Add block menu ────────────────────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-dashed text-muted-foreground hover:text-foreground w-full"
        onClick={() => setOpen(o => !o)}
      >
        <Plus className="w-4 h-4" />
        Añadir bloque
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl p-2 grid grid-cols-3 gap-1 w-72">
          {BLOCK_TYPES.map(bt => {
            const Icon = bt.icon;
            return (
              <button
                key={bt.type}
                onClick={() => { onAdd(bt.type); setOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-4 h-4" />
                {bt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

interface Props {
  initialBlocks?: Block[];
  onChange?: (blocks: Block[]) => void;
}

export function LessonBlockEditor({ initialBlocks = [], onChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  const update = useCallback((updated: Block[]) => {
    setBlocks(updated);
    onChange?.(updated);
  }, [onChange]);

  function updateBlock(index: number, block: Block) {
    const next = [...blocks];
    next[index] = block;
    update(next);
  }

  function deleteBlock(index: number) {
    update(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  function addBlock_(type: string) {
    update([...blocks, addBlock(type)]);
  }

  return (
    <div className="space-y-1">
      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          <AlignLeft className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Sin contenido. Añade tu primer bloque abajo.</p>
        </div>
      )}

      {blocks.map((block, i) => (
        <BlockRow
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          onChange={b => updateBlock(i, b)}
          onDelete={() => deleteBlock(i)}
          onMove={dir => moveBlock(i, dir)}
        />
      ))}

      <div className="pt-2">
        <AddBlockMenu onAdd={addBlock_} />
      </div>
    </div>
  );
}
