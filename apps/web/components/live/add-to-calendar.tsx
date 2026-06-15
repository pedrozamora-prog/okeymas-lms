"use client";

import { CalendarPlus, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { googleCalendarUrl, outlookWebUrl } from "@/lib/calendar";

interface AddToCalendarProps {
  id: string;
  title: string;
  scheduledAt: string; // ISO string
  durationMins: number;
  roomUrl?: string | null;
}

export function AddToCalendar({ id, title, scheduledAt, durationMins, roomUrl }: AddToCalendarProps) {
  const startAt = new Date(scheduledAt);
  const endAt = new Date(startAt.getTime() + durationMins * 60 * 1000);
  const description = roomUrl ? `Únete a la clase en: ${roomUrl}` : "Clase en directo en Formia";

  const googleUrl = googleCalendarUrl({ title, startAt, endAt, description, location: roomUrl ?? undefined });
  const outlookUrl = outlookWebUrl({ title, startAt, endAt, description, location: roomUrl ?? undefined });
  const icalUrl = `/api/live/${id}/ical`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <CalendarPlus className="w-3.5 h-3.5" />
          Añadir al calendario
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Elige tu calendario
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
            <CalendarPlus className="w-4 h-4 text-[#4285F4]" />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
            <Mail className="w-4 h-4 text-[#0078D4]" />
            Outlook (web)
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={icalUrl} download className="flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>
              Descargar .ics
              <span className="block text-[10px] text-muted-foreground font-normal leading-tight">Apple, Outlook desktop…</span>
            </span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
