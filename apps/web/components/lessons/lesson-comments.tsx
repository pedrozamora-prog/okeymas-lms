"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Reply, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string };
  replies: Comment[];
}

interface Props {
  lessonId: string;
  currentUserId: string;
  currentUserRole: string;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-yelau-yellow/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-yelau-yellow">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function CommentItem({
  comment, currentUserId, currentUserRole, lessonId, onDelete, depth = 0,
}: {
  comment: Comment;
  currentUserId: string;
  currentUserRole: string;
  lessonId: string;
  onDelete: (id: string) => void;
  depth?: number;
}) {
  const [replying, setReplying]   = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies]     = useState(comment.replies);
  const [showReplies, setShow]    = useState(true);
  const [loading, setLoading]     = useState(false);

  const canDelete = comment.user.id === currentUserId ||
    ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(currentUserRole);

  async function handleReply() {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: replyText, parentId: comment.id }),
      });
      if (!res.ok) throw new Error();
      const newReply = await res.json();
      setReplies(r => [...r, newReply]);
      setReplyText("");
      setReplying(false);
    } catch {
      toast.error("Error al responder");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este comentario?")) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ commentId: comment.id }),
      });
      if (!res.ok) throw new Error();
      onDelete(comment.id);
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-8 border-l-2 border-border pl-4")}>
      <Avatar name={comment.user.name} />
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">{comment.user.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
              </span>
              {canDelete && (
                <button onClick={handleDelete} className="text-muted-foreground hover:text-red-500 transition-colors ml-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
        </div>

        <div className="flex items-center gap-3 mt-1.5 px-1">
          {depth === 0 && (
            <button
              onClick={() => setReplying(r => !r)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Responder
            </button>
          )}
          {replies.length > 0 && (
            <button
              onClick={() => setShow(s => !s)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {replies.length} respuesta{replies.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex gap-2">
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="text-sm min-h-[60px] resize-none"
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleReply(); }}
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={handleReply} disabled={loading || !replyText.trim()}
                className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 h-8 px-3">
                <Send className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplying(false)} className="h-8 px-3">✕</Button>
            </div>
          </div>
        )}

        {showReplies && replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                lessonId={lessonId}
                onDelete={id => setReplies(r => r.filter(x => x.id !== id))}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LessonComments({ lessonId, currentUserId, currentUserRole }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/comments`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setComments(data))
      .finally(() => setFetching(false));
  }, [lessonId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setComments(c => [newComment, ...c]);
      setText("");
    } catch {
      toast.error("Error al publicar el comentario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-yelau-yellow" />
        <h3 className="font-bold text-foreground">
          Foro de la lección
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({comments.length} comentario{comments.length !== 1 ? "s" : ""})
            </span>
          )}
        </h3>
      </div>

      {/* Nuevo comentario */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar name={currentUserId} />
        <div className="flex-1 space-y-2">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Haz una pregunta o comparte algo sobre esta lección..."
            className="resize-none min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !text.trim()}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
            >
              <Send className="w-4 h-4" />
              Publicar
            </Button>
          </div>
        </div>
      </form>

      {/* Lista de comentarios */}
      {fetching ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando comentarios...</div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Sé el primero en comentar esta lección</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              lessonId={lessonId}
              onDelete={id => setComments(c => c.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
