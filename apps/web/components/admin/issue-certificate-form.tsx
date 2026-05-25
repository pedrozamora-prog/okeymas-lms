"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Award, Plus, Loader2 } from "lucide-react";

interface User   { id: string; name: string; email: string }
interface Course { id: string; title: string }

interface Props {
  users:   User[];
  courses: Course[];
}

export function IssueCertificateForm({ users, courses }: Props) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [userId, setUserId]       = useState("");
  const [courseId, setCourseId]   = useState("");
  const [type, setType]           = useState("COMPLETION");
  const [validity, setValidity]   = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !courseId) { toast.error("Selecciona usuario y curso"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId, type, validityDays: validity || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Certificado emitido correctamente");
      setOpen(false);
      setUserId(""); setCourseId(""); setType("COMPLETION"); setValidity("");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al emitir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2">
          <Plus className="w-4 h-4" />
          Emitir certificado
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yelau-yellow" />
            Emitir certificado manualmente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Usuario */}
          <div className="space-y-1.5">
            <Label>Alumno <span className="text-red-400">*</span></Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un alumno..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-medium">{u.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Curso */}
          <div className="space-y-1.5">
            <Label>Curso <span className="text-red-400">*</span></Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo de certificado</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETION">Finalización</SelectItem>
                <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validez */}
          <div className="space-y-1.5">
            <Label htmlFor="validity">Validez (días)</Label>
            <Input
              id="validity"
              type="number"
              min={1}
              value={validity}
              onChange={e => setValidity(e.target.value)}
              placeholder="Sin caducidad"
            />
            <p className="text-[11px] text-muted-foreground">Dejar vacío = sin fecha de caducidad</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Emitir
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
