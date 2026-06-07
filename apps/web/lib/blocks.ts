// Block content types for the lesson authoring tool

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "video"
  | "callout"
  | "quiz"
  | "divider"
  | "file";

export type HeadingBlock  = { id: string; type: "heading";   level: 1 | 2 | 3; text: string };
export type ParagraphBlock = { id: string; type: "paragraph"; text: string };
export type ImageBlock    = { id: string; type: "image";     url: string; alt?: string; caption?: string };
export type VideoBlock    = { id: string; type: "video";     url: string; title?: string };
export type CalloutBlock  = { id: string; type: "callout";   variant: "info" | "warning" | "tip" | "danger"; title?: string; text: string };
export type QuizOption    = { id: string; text: string; correct: boolean };
export type QuizBlock     = { id: string; type: "quiz";      question: string; options: QuizOption[]; explanation?: string };
export type DividerBlock  = { id: string; type: "divider" };
export type FileBlock     = { id: string; type: "file";      url: string; filename: string; description?: string };

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | VideoBlock
  | CalloutBlock
  | QuizBlock
  | DividerBlock
  | FileBlock;

export function getVideoEmbed(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Direct MP4 / already an embed
  if (url.includes("/embed/") || url.endsWith(".mp4") || url.endsWith(".webm")) return url;
  return null;
}
