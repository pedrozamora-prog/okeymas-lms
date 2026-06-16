"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  initialName: string;
  initialPhone: string | null;
  initialWhatsappPhone: string | null;
}

export function EditProfileDialog({ initialName, initialPhone, initialWhatsappPhone }: Props) {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [name, setName]               = useState(initialName);
  const [phone, setPhone]             = useState(initialPhone ?? "");
  const [whatsappPhone, setWhatsapp]  = useState(initialWhatsappPhone ?? "");
  const [saving, setSaving]           = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          name.trim() || undefined,
          phone:         phone.trim() || null,
          whatsappPhone: whatsappPhone.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Perfil actualizado");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Pencil className="w-3.5 h-3.5" />
        Editar perfil
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                Número de WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={whatsappPhone}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+34 600 000 000"
              />
              <p className="text-xs text-muted-foreground">
                Formato internacional, ej: +34600000000. Necesario para recibir notificaciones y mensajes de prueba.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
